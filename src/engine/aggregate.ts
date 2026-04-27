/**
 * Совокупность преступлений и приговоров — Этап 4.3.
 *
 * Реализованы правила:
 *   M-069-2 — совокупность небольшой/средней: max ≤ max_наиб × 1.5;
 *   M-069-3 — с тяжким/особо тяжким: только сложение, max ≤ max_наиб × 1.5,
 *              но не более 25 лет ЛС;
 *   M-069-4 — дополнительные виды складываются по виду до лимита;
 *   M-069-5 — преступление до приговора: расчёт по чч. 2/3 минус отбытое;
 *   M-070    — совокупность приговоров: к новому присоединяется неотбытая
 *              часть; ЛС ≤ 30 лет;
 *   M-070-25 — для террористических составов лимит 35 лет ЛС.
 *
 * v1 ограничения:
 *   • покрывается только лишение свободы (доминирующий вид в практике);
 *   • расчёт «до приговора» (ст. 69 ч. 5) учитывает только отбытое по
 *     старому приговору в Duration → Days (без учёта режимов и зачёта).
 */

import { CrimeCategory, PunishmentKind } from '@domain/enums';
import type {
  ArticlePart,
  Conviction,
  Episode,
  RuleApplication,
} from '@domain/types';
import { rule, type RuleId } from '@legal/rules/catalogue';

import { durationToDays, formatDays } from './duration';
import type { EpisodeCalc, Range } from './types';

const Y = 360;
const LIMIT_25 = 25 * Y;
const LIMIT_30 = 30 * Y;
const LIMIT_35 = 35 * Y;

interface AggregateInput {
  episodes: { episode: Episode; part: ArticlePart; calc: EpisodeCalc }[];
  /** Приговоры, конфликтующие по T-069-5 (новые эпизоды до их вступления в силу). */
  pendingConvictions69_5: Conviction[];
  /** Приговоры, конфликтующие по T-070 (эпизоды в период неотбытого старого). */
  pendingConvictions70: Conviction[];
}

export interface AggregateResult {
  kind: 'single' | 'art69_2' | 'art69_3' | 'art69_5' | 'art70';
  range: Range;
  log: RuleApplication[];
  warnings: string[];
  /** Применены ли террор-лимиты M-070-25. */
  terrorismLimitApplied: boolean;
}

const logRule = (
  ruleId: RuleId,
  description: string,
  before?: Range,
  after?: Range,
): RuleApplication => {
  const r = rule(ruleId);
  return {
    ruleId,
    norm: r.norm,
    source: r.source,
    description,
    before: before ? { min: before.min, max: before.max } : undefined,
    after: after ? { min: after.min, max: after.max } : undefined,
  };
};

// ────────────────────────────────────────────────────────────────────────────

export function computeAggregate(input: AggregateInput): AggregateResult {
  const { episodes, pendingConvictions69_5, pendingConvictions70 } = input;
  const steps: RuleApplication[] = [];
  const warnings: string[] = [];

  if (episodes.length === 0) {
    return {
      kind: 'single',
      range: { min: 0, max: 0 },
      log: steps,
      warnings: ['Нет ни одного эпизода для расчёта.'],
      terrorismLimitApplied: false,
    };
  }

  // Считаем только эпизоды, у которых главный вид — ЛС (другие игнорируем
  // в v1 — либо складываем отдельно по их шкалам, либо предупреждение).
  const imprEpisodes = episodes.filter(
    (e) => e.calc.punishmentKind === PunishmentKind.Imprisonment,
  );
  const nonImpr = episodes.filter(
    (e) => e.calc.punishmentKind !== PunishmentKind.Imprisonment,
  );
  if (nonImpr.length > 0) {
    warnings.push(
      `${nonImpr.length} эпизод(ов) с основным видом не «ЛС» — совокупность для них в v1 не считается.`,
    );
  }

  if (imprEpisodes.length === 0) {
    return {
      kind: 'single',
      range: episodes[0]!.calc.finalRange,
      log: steps,
      warnings,
      terrorismLimitApplied: false,
    };
  }

  // Самый «тяжёлый» по max диапазон — отправная точка совокупности.
  const sortedByMax = [...imprEpisodes].sort(
    (a, b) => b.calc.finalRange.max - a.calc.finalRange.max,
  );
  const heaviest = sortedByMax[0]!;

  // Один эпизод — никакой совокупности не нужно.
  if (imprEpisodes.length === 1) {
    let result: AggregateResult = {
      kind: 'single',
      range: { ...heaviest.calc.finalRange },
      log: steps,
      warnings,
      terrorismLimitApplied: false,
    };
    result = applyConvictions(result, pendingConvictions69_5, pendingConvictions70);
    result = applyTerrorismLimit(result, episodes);
    return result;
  }

  // Категории всех эпизодов
  const hasHeavyPlus = imprEpisodes.some((e) => {
    const c = e.episode.effectiveCategory ?? e.part.category;
    return c === CrimeCategory.Heavy || c === CrimeCategory.EspeciallyHeavy;
  });

  // Сложение min/max по эпизодам.
  const sumMax = imprEpisodes.reduce((s, e) => s + e.calc.finalRange.max, 0);
  const sumMin = imprEpisodes.reduce((s, e) => s + e.calc.finalRange.min, 0);
  const maxOfMins = Math.max(...imprEpisodes.map((e) => e.calc.finalRange.min));

  // База совокупности по чч. 2/3:
  //  • ч. 2 — поглощение или сложение, max ≤ max_наиб × 1.5
  //  • ч. 3 — только сложение, max ≤ max_наиб × 1.5, но не более 25 лет
  const ceilingFromHeaviest = Math.floor(heaviest.calc.finalRange.max * 1.5);
  let aggregateMax = Math.min(sumMax, ceilingFromHeaviest);

  // Нижняя граница совокупности (правило частичного сложения):
  //  • ч. 3 (только сложение): F = Σaᵢ, поэтому min F = Σ min_i;
  //  • ч. 2 (допускается поглощение): минимально возможное F при поглощении
  //    = max(назначенных), в нижнем регистре назначений = max(min_i).
  // Если этот предел превышает aggregateMax (редкий случай: суммарные
  // минимумы санкций больше 1.5×max-наиб), прижимаем к aggregateMax.
  let aggregateMin = hasHeavyPlus ? sumMin : maxOfMins;
  if (aggregateMin > aggregateMax) {
    warnings.push(
      `Сумма минимумов санкций (${formatDays(aggregateMin)}) превышает потолок совокупности (${formatDays(aggregateMax)}). Граница min прижата к потолку — это знак внутреннего противоречия в санкциях; проверьте E-064 и категории.`,
    );
    aggregateMin = aggregateMax;
  }

  let kind: AggregateResult['kind'] = 'art69_2';

  if (hasHeavyPlus) {
    aggregateMax = Math.min(aggregateMax, LIMIT_25);
    if (aggregateMin > aggregateMax) aggregateMin = aggregateMax;
    kind = 'art69_3';
    steps.push(
      logRule(
        'M-069-3',
        `Совокупность с тяжким/особо тяжким: только сложение. ` +
          `min = Σ min_эпизодов = ${formatDays(sumMin)}; ` +
          `max ≤ ${formatDays(ceilingFromHeaviest)} (1.5× от max наиб.), но не более ${formatDays(LIMIT_25)} (25 лет).`,
        undefined,
        { min: aggregateMin, max: aggregateMax },
      ),
    );
  } else {
    steps.push(
      logRule(
        'M-069-2',
        `Совокупность небольшой/средней: поглощение или сложение. ` +
          `min ≥ max(min_эпизодов) = ${formatDays(maxOfMins)}; ` +
          `max ≤ ${formatDays(ceilingFromHeaviest)} (1.5× от max наиб.).`,
        undefined,
        { min: aggregateMin, max: aggregateMax },
      ),
    );
  }

  let result: AggregateResult = {
    kind,
    range: { min: aggregateMin, max: aggregateMax },
    log: steps,
    warnings,
    terrorismLimitApplied: false,
  };

  result = applyConvictions(result, pendingConvictions69_5, pendingConvictions70);
  result = applyTerrorismLimit(result, episodes);

  return result;
}

// ────────────────────────────────────────────────────────────────────────────
// Помощники
// ────────────────────────────────────────────────────────────────────────────

function applyConvictions(
  res: AggregateResult,
  conv69_5: Conviction[],
  conv70: Conviction[],
): AggregateResult {
  const log = [...res.log];
  let range = { ...res.range };
  let kind = res.kind;
  const warnings = [...res.warnings];

  // M-069-5: эпизод до приговора → из расчёта вычитается фактически отбытое
  for (const c of conv69_5) {
    if (!c.actuallyServed) {
      warnings.push(
        `Приговор от ${c.effectiveDate} (T-069-5): не указан фактически отбытый срок — вычитание невозможно.`,
      );
      continue;
    }
    const served = durationToDays(c.actuallyServed);
    const before = { ...range };
    range = {
      min: Math.max(0, range.min - served),
      max: Math.max(0, range.max - served),
    };
    kind = 'art69_5';
    log.push(
      logRule(
        'M-069-5',
        `Эпизод(ы) до приговора от ${c.effectiveDate}: вычитается фактически отбытое ${formatDays(served)}.`,
        before,
        range,
      ),
    );
  }

  // M-070: к новому наказанию присоединяется неотбытая часть
  for (const c of conv70) {
    if (!c.unservedPart) {
      // если не указана — вычислим как длительность приговора − фактически отбытое
      const total = durationToDays(c.sentence.duration);
      const served = c.actuallyServed ? durationToDays(c.actuallyServed) : 0;
      const remaining = Math.max(0, total - served);
      if (remaining === 0) {
        warnings.push(
          `Приговор от ${c.effectiveDate} (T-070): неотбытая часть = 0 — присоединение нулевое.`,
        );
        continue;
      }
      const before = { ...range };
      range = { min: range.min + remaining, max: range.max + remaining };
      kind = 'art70';
      log.push(
        logRule(
          'M-070-1',
          `Совокупность приговоров: к новому присоединяется неотбытая часть ${formatDays(remaining)} (приговор от ${c.effectiveDate}).`,
          before,
          range,
        ),
      );
    } else {
      const remaining = durationToDays(c.unservedPart);
      const before = { ...range };
      range = { min: range.min + remaining, max: range.max + remaining };
      kind = 'art70';
      log.push(
        logRule(
          'M-070-1',
          `Совокупность приговоров: присоединяется указанная неотбытая часть ${formatDays(remaining)}.`,
          before,
          range,
        ),
      );
    }
  }

  // Лимит 30 лет
  if (kind === 'art70' && range.max > LIMIT_30) {
    const before = { ...range };
    range = { ...range, max: LIMIT_30 };
    log.push(
      logRule(
        'M-070-1',
        `Лимит 30 лет ЛС по совокупности приговоров (ст. 70 ч. 3).`,
        before,
        range,
      ),
    );
  }

  return { ...res, log, range, kind, warnings };
}

function applyTerrorismLimit(
  res: AggregateResult,
  episodes: AggregateInput['episodes'],
): AggregateResult {
  const hasTerror = episodes.some((e) => e.part.isTerrorism === true);
  if (!hasTerror) return res;
  if (res.range.max <= LIMIT_35) return { ...res, terrorismLimitApplied: false };
  const before = { ...res.range };
  const range = { ...res.range, max: LIMIT_35 };
  return {
    ...res,
    range,
    terrorismLimitApplied: true,
    log: [
      ...res.log,
      logRule(
        'M-070-25',
        `Состав в перечне террор./экстремистских: лимит 35 лет ЛС (ст. 70 + ст. 56 ч. 5).`,
        before,
        range,
      ),
    ],
  };
}

/**
 * Расчёт по одному эпизоду — Master Engine, ядро правил Этапа 4.
 *
 * Последовательность коэффициентов (ППВС № 58/2015, № 60/2006, № 16/2012):
 *   1. Выбор основного вида наказания (для v1: лишение свободы, если есть в
 *      санкции; иначе самый тяжёлый из «срочных» альтернатив).
 *   2. Юношеский режим (ст. 88) — снижает max ЛС до 6/10 лет, минимумы / 2.
 *   3. Стадия (ст. 66 чч. 2/3) — приготовление max × 1/2, покушение × 3/4.
 *   4. Снисхождение присяжных (ст. 65 ч. 1) — max × 2/3, ПЛС/смертная нет.
 *   5. Смягчающие «и»/«к» без отягчающих (ст. 62 ч. 1) — max × 2/3.
 *   6. Досудебное соглашение (ст. 62 ч. 2) — max × 1/2.
 *   7. Особый порядок (ст. 62 ч. 5) — max × 2/3.
 *   8. Рецидив (ст. 68 ч. 2) — min = max(MIN_санкции, max_текущий × 1/3).
 *   9. Исключительные обстоятельства (ст. 64) — min = 0 (запрещено для
 *      перечня ст. 64 ч. 3, в т. ч. террор. составов).
 *
 * Все коэффициенты применяются СНАЧАЛА к сниженному max, последовательно.
 * Минимум санкции (MIN_санкции) берётся ИСХОДНЫЙ — сужать его умеют только
 * ст. 64 (вниз) и ст. 68 ч. 2 (вверх).
 */

import {
  CrimeCategory,
  PunishmentKind,
  RecidivismKind,
} from '@domain/enums';
import type {
  ArticlePart,
  Episode,
  RuleApplication,
  SanctionOption,
  Subject,
} from '@domain/types';
import { ageAt } from '@legal/filters/subject-filters';
import { hasArt62_1Trigger } from '@legal/data/circumstances';
import { rule, type RuleId } from '@legal/rules/catalogue';
import { formatDays } from './duration';
import type { EpisodeCalc, Range } from './types';

// ────────────────────────────────────────────────────────────────────────────
// Контекст расчёта
// ────────────────────────────────────────────────────────────────────────────

export interface EpisodeContext {
  subject: Subject;
  /** Дата приговора — для проверки совершеннолетия и ст. 88. */
  trialDate: string;
  /** Особый порядок (УПК гл. 40). */
  specialProcedure: boolean;
  /** Досудебное соглашение (УПК гл. 40.1). */
  preTrialAgreement: boolean;
  /** Дело рассматривал суд присяжных. */
  juryTrial: boolean;
  /** Вид рецидива (рассчитан Этапом 2). */
  recidivism: RecidivismKind;
}

const Y = 360;

// ────────────────────────────────────────────────────────────────────────────
// Утилиты
// ────────────────────────────────────────────────────────────────────────────

const log = (
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

/** Применить дробь num/den к max, оставив min. */
const applyMaxFraction = (r: Range, num: number, den: number): Range => ({
  min: r.min,
  max: Math.floor((r.max * num) / den),
});

/** Поднять min до требуемого уровня. */
const raiseMin = (r: Range, value: number): Range => ({
  min: Math.max(r.min, value),
  max: r.max,
});

/**
 * Выбрать основной вид наказания из санкции:
 *   • если есть ЛС — берём ЛС (95% случаев);
 *   • иначе самый тяжёлый «срочный» из доступных (по шкале PunishmentKind).
 *
 * Дополнительные виды (`isAdditional`) пропускаются.
 */
function pickMainSanction(part: ArticlePart): SanctionOption | null {
  const main = part.sanctions.filter((s) => !s.isAdditional);
  if (main.length === 0) return null;
  const impr = main.find((s) => s.kind === PunishmentKind.Imprisonment);
  if (impr) return impr;
  const order: PunishmentKind[] = [
    PunishmentKind.LifeImprisonment,
    PunishmentKind.DisciplinaryUnit,
    PunishmentKind.Arrest,
    PunishmentKind.ForcedWork,
    PunishmentKind.RestrictionOfFreedom,
    PunishmentKind.MilitaryRestriction,
    PunishmentKind.CorrectionalWork,
    PunishmentKind.MandatoryWork,
    PunishmentKind.DeprivationOfRight,
    PunishmentKind.DeprivationOfTitle,
    PunishmentKind.Fine,
  ];
  for (const k of order) {
    const f = main.find((s) => s.kind === k);
    if (f) return f;
  }
  return main[0]!;
}

// ────────────────────────────────────────────────────────────────────────────
// Главная функция
// ────────────────────────────────────────────────────────────────────────────

export function computeEpisode(
  episode: Episode,
  part: ArticlePart,
  ctx: EpisodeContext,
): EpisodeCalc {
  const steps: RuleApplication[] = [];
  const warnings: string[] = [];

  const sanction = pickMainSanction(part);
  if (!sanction) {
    return {
      episodeId: episode.id,
      punishmentKind: PunishmentKind.Imprisonment,
      baseRange: { min: 0, max: 0 },
      finalRange: { min: 0, max: 0 },
      log: [],
      warnings: ['В санкции нет ни одного основного вида наказания.'],
    };
  }

  const punishmentKind = sanction.kind;
  let range: Range = { min: sanction.min, max: sanction.max };
  const baseRange = { ...range };

  // Если основной вид — не ЛС (а штраф/обяз. работы), коэффициенты ст. 66/62/65/68
  // фактически применимы реже. v1 предупреждает и применяет «как умеем».
  if (
    punishmentKind !== PunishmentKind.Imprisonment &&
    punishmentKind !== PunishmentKind.LifeImprisonment
  ) {
    warnings.push(
      `Основной вид: ${punishmentKind}. Коэффициенты ст. 66/62/65/68 применяются формально; в v1 это не покрыто экспертно.`,
    );
  }

  // ── 2. Юношеский режим (ст. 88 ч. 6, 6.1) ───────────────────────────────
  const ageAtCommit = ageAt(ctx.subject.birthDate, episode.commitDate);
  const isJuvenile = ageAtCommit < 18;
  if (isJuvenile && punishmentKind === PunishmentKind.Imprisonment) {
    // Лимит max ЛС: 6 лет (если <16 на момент совершения и состав не особо тяжкий)
    // или 10 лет (в иных случаях).
    const baseCategory = episode.effectiveCategory ?? part.category;
    const limitYears =
      ageAtCommit < 16 && baseCategory !== CrimeCategory.EspeciallyHeavy ? 6 : 10;
    const limitDays = limitYears * Y;
    if (range.max > limitDays) {
      const before = { ...range };
      range = { ...range, max: limitDays };
      steps.push(
        log(
          'J-088-MAX',
          `Несовершеннолетний на момент совершения. Лимит max ЛС — ${limitYears} лет.`,
          before,
          range,
        ),
      );
    }
    // Минимум — / 2 (ст. 88 ч. 6.1) — при наличии смягчающих.
    if (episode.flags.mitigatingIds.length > 0 && range.min > 0) {
      const before = { ...range };
      range = { ...range, min: Math.floor(range.min / 2) };
      steps.push(
        log(
          'J-088-MIN',
          'Несовершеннолетие + смягчающие → минимум санкции / 2 (ст. 88 ч. 6.1).',
          before,
          range,
        ),
      );
    }
  }

  // ── 3. Стадия (ст. 66) ──────────────────────────────────────────────────
  if (episode.stage === 'preparation') {
    const before = { ...range };
    range = applyMaxFraction(range, 1, 2);
    steps.push(
      log('E-066-2', 'Приготовление: max × 1/2 (ст. 66 ч. 2).', before, range),
    );
    // ст. 66 ч. 4: ПЛС и смертная не назначаются
    if (
      punishmentKind === PunishmentKind.LifeImprisonment ||
      sanction.kind === PunishmentKind.DeathPenalty
    ) {
      steps.push(log('E-066-4', 'При неоконченном — ПЛС и смертная не назначаются.'));
    }
  } else if (episode.stage === 'attempt') {
    const before = { ...range };
    range = applyMaxFraction(range, 3, 4);
    steps.push(
      log('E-066-3', 'Покушение: max × 3/4 (ст. 66 ч. 3).', before, range),
    );
  }

  // ── 4. Снисхождение присяжных (ст. 65 ч. 1) ─────────────────────────────
  // По ППВС № 58/2015 п. 42 применяется до ст. 62 ч. 1.
  if (ctx.juryTrial && episode.flags.art65) {
    const before = { ...range };
    range = applyMaxFraction(range, 2, 3);
    steps.push(
      log('E-065-1', 'Снисхождение присяжных: max × 2/3 (ст. 65 ч. 1). ПЛС/смертная не применяются.', before, range),
    );
  }

  // ── 5. Смягчающие «и»/«к» без отягчающих (ст. 62 ч. 1) ─────────────────
  const hasIK = hasArt62_1Trigger(episode.flags.mitigatingIds);
  const hasAggravating = episode.flags.aggravatingIds.length > 0;
  // Принимаем ИЛИ явное подтверждение пользователя, ИЛИ автодетектор.
  const art62_1Applies =
    (episode.flags.art62_1 || (hasIK && !hasAggravating)) && !hasAggravating;

  if (art62_1Applies) {
    // Исключение E-062-3: если санкция включает ПЛС или смертную, ст. 62 ч. 1 не применяется.
    const hasLifeOrDeath = part.sanctions.some(
      (s) =>
        !s.isAdditional &&
        (s.kind === PunishmentKind.LifeImprisonment ||
          s.kind === PunishmentKind.DeathPenalty),
    );
    if (hasLifeOrDeath) {
      steps.push(
        log(
          'E-062-3',
          'Санкция включает ПЛС/смертную → правила ст. 62 чч. 1–2 не применяются.',
        ),
      );
    } else {
      const before = { ...range };
      range = applyMaxFraction(range, 2, 3);
      steps.push(
        log(
          'E-062-1',
          'Смягчающие «и»/«к» без отягчающих: max × 2/3 (ст. 62 ч. 1).',
          before,
          range,
        ),
      );
    }
  }

  // ── 6. Досудебное соглашение (ст. 62 ч. 2) ──────────────────────────────
  if (ctx.preTrialAgreement && art62_1Applies) {
    const before = { ...range };
    range = applyMaxFraction(range, 1, 2);
    steps.push(
      log(
        'E-062-2',
        'Досудебное соглашение + и/к без отягчающих: max × 1/2 (ст. 62 ч. 2).',
        before,
        range,
      ),
    );
  }

  // ── 7. Особый порядок (ст. 62 ч. 5) ─────────────────────────────────────
  if (ctx.specialProcedure) {
    const before = { ...range };
    range = applyMaxFraction(range, 2, 3);
    steps.push(
      log('E-062-5', 'Особый порядок: max × 2/3 (ст. 62 ч. 5).', before, range),
    );
  }

  // ── 8. Рецидив (ст. 68 ч. 2) ────────────────────────────────────────────
  if (ctx.recidivism !== RecidivismKind.None) {
    const oneThirdMax = Math.floor((range.max * 1) / 3);
    const targetMin = Math.max(sanction.min, oneThirdMax);
    if (targetMin > range.min) {
      const before = { ...range };
      range = raiseMin(range, targetMin);
      steps.push(
        log(
          'E-068-2',
          `Рецидив (${ctx.recidivism}): MIN = max(MIN санкции, MAX × 1/3) = ${formatDays(targetMin)}.`,
          before,
          range,
        ),
      );
    }
    // ст. 68 ч. 3 — допускается ниже 1/3 при смягчающих, но это судейская
    // дискреция; v1 не применяет автоматически.
    if (episode.flags.mitigatingIds.length > 0) {
      steps.push(
        log(
          'E-068-3',
          'Есть смягчающие — допустимо назначить ниже 1/3 max (но не ниже минимума санкции). Решение суда.',
        ),
      );
    }
  }

  // ── 9. Исключительные обстоятельства (ст. 64) ───────────────────────────
  if (episode.flags.art64) {
    if (part.isTerrorism) {
      steps.push(
        log(
          'E-064-EXCL',
          'Состав в перечне ст. 64 ч. 3 (террор./иные): ст. 64 не применяется.',
        ),
      );
      warnings.push('Флаг ст. 64 установлен, но состав запрещает её применение (E-064-EXCL).');
    } else {
      const before = { ...range };
      range = { ...range, min: 0 };
      steps.push(
        log(
          'E-064',
          'Исключительные обстоятельства: MIN = 0 (ст. 64). Также допустим более мягкий вид или отказ от обяз. дополнительного.',
          before,
          range,
        ),
      );
    }
  }

  // Защита от inverted range
  if (range.max < range.min) {
    warnings.push(
      `Расчёт даёт min (${range.min}) > max (${range.max}). Это сигнал о противоречии правил для данной санкции.`,
    );
  }

  return {
    episodeId: episode.id,
    punishmentKind,
    baseRange,
    finalRange: range,
    log: steps,
    warnings,
  };
}

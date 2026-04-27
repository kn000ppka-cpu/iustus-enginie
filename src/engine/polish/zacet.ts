/**
 * Зачёт срока содержания под стражей (СИЗО) и домашнего ареста — ст. 72 УК.
 *
 * Коэффициенты по ч. 3.1:
 *   п. «а» — строгий / особый / тюрьма: 1 день СИЗО = 1 день ЛС
 *   п. «б» — общий / воспитательная:    1 день СИЗО = 1.5 дня ЛС
 *   п. «в» — поселение:                  1 день СИЗО = 2 дня ЛС
 *
 * Часть 3.4 — домашний арест:
 *   2 дня домашнего ареста = 1 день СИЗО → дальше по схеме режима.
 *
 * Часть 3.2 — исключения (P-072-EXCL):
 *   при особо опасном рецидиве и для составов из перечня (террор. /
 *   экстремистские) — зачёт всегда 1:1 независимо от режима.
 *
 * Задержание (`Detained`) приравнивается к СИЗО (по практике ППВС № 21/2011).
 */

import { FacilityKind } from '@domain/enums';
import type { DetentionPeriod, RuleApplication } from '@domain/types';
import { rule, type RuleId } from '@legal/rules/catalogue';

import { formatDays } from '../duration';
import type { Range } from '../types';

export interface ZacetInput {
  facility: FacilityKind;
  /** Применяется ли исключение 1:1 (T-072-EXCL). */
  oneToOneOnly: boolean;
  periods: DetentionPeriod[];
}

export interface ZacetResult {
  /** Сумма зачёта в днях ЛС. */
  totalCreditDays: number;
  /** Лог по каждому периоду. */
  log: RuleApplication[];
  warnings: string[];
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

/** Дней между двумя ISO-датами включительно. Если from > to — 0. */
export function daysBetweenInclusive(fromIso: string, toIso: string): number {
  const a = new Date(fromIso).getTime();
  const b = new Date(toIso).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || a > b) return 0;
  return Math.floor((b - a) / 86_400_000) + 1;
}

/** Коэффициент СИЗО → ЛС в зависимости от режима (после 14.07.2018). */
function custodyCoefficient(facility: FacilityKind, oneToOne: boolean): {
  num: number;
  den: number;
  ruleId: RuleId;
  text: string;
} {
  if (oneToOne) {
    return {
      num: 1,
      den: 1,
      ruleId: 'P-072-EXCL',
      text: '1:1 (исключение ст. 72 ч. 3.2)',
    };
  }
  switch (facility) {
    case FacilityKind.Settlement:
      return { num: 2, den: 1, ruleId: 'P-072-3.1-V', text: '1:2 (поселение, п. «в»)' };
    case FacilityKind.GeneralRegime:
    case FacilityKind.EducationalColony:
      return { num: 3, den: 2, ruleId: 'P-072-3.1-B', text: '1:1.5 (общий/воспит., п. «б»)' };
    case FacilityKind.StrictRegime:
    case FacilityKind.SpecialRegime:
    case FacilityKind.Prison:
    default:
      return { num: 1, den: 1, ruleId: 'P-072-3.1-A', text: '1:1 (строгий/особый/тюрьма, п. «а»)' };
  }
}

// ────────────────────────────────────────────────────────────────────────────

export function computeZacet(input: ZacetInput): ZacetResult {
  const { facility, oneToOneOnly, periods } = input;
  const log: RuleApplication[] = [];
  const warnings: string[] = [];

  let total = 0;
  const coef = custodyCoefficient(facility, oneToOneOnly);

  for (const p of periods) {
    const dur = daysBetweenInclusive(p.from, p.to);
    if (dur === 0) {
      warnings.push(`Период ${p.from} → ${p.to}: некорректный диапазон, пропущен.`);
      continue;
    }

    if (p.regime === 'house_arrest') {
      // Сначала 2:1 → дни СИЗО, потом по схеме режима.
      const sizoDays = Math.floor(dur / 2);
      const credit = Math.floor((sizoDays * coef.num) / coef.den);
      total += credit;
      log.push(
        logRule(
          'P-072-3.4',
          `Домашний арест ${formatDays(dur)} → ${formatDays(sizoDays)} СИЗО (2:1, ст. 72 ч. 3.4) → зачёт ${formatDays(credit)} ЛС (${coef.text}).`,
        ),
      );
    } else {
      // СИЗО / задержание — сразу по коэффициенту режима.
      const credit = Math.floor((dur * coef.num) / coef.den);
      total += credit;
      log.push(
        logRule(
          coef.ruleId,
          `${p.regime === 'detained' ? 'Задержание' : 'Содержание под стражей'} ${formatDays(dur)} → зачёт ${formatDays(credit)} ЛС (${coef.text}).`,
        ),
      );
    }
  }

  return { totalCreditDays: total, log, warnings };
}

/** Применить общий зачёт к диапазону. Не уходит ниже 0. */
export function applyZacet(range: Range, totalCreditDays: number): Range {
  return {
    min: Math.max(0, range.min - totalCreditDays),
    max: Math.max(0, range.max - totalCreditDays),
  };
}

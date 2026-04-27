/**
 * УДО — условно-досрочное освобождение (УК ст. 79).
 *
 * Доли реально отбытого срока (ч. 3):
 *   п. «а» — небольшой / средней тяжести: 1/3
 *   п. «б» — тяжкое:                       1/2
 *   п. «в» — особо тяжкое:                 2/3
 *   п. «г» — террор. составы:              3/4
 *   п. «д» — половые против лиц до 14:     4/5
 *   ч. 5  — пожизненное ЛС:                25 лет реального отбытия.
 *
 * Возвращаются:
 *   • daysServedRequired — сколько дней реального отбытия нужно для УДО;
 *   • earliestDate — ISO-дата самого раннего дня подачи ходатайства об УДО,
 *     если у нас есть `servingStartDate` (иначе null).
 *
 * NB (глобальный принцип №1, утв. пользователем): период УДО НЕ
 * засчитывается как отбытие. Поэтому здесь не применяем коррекций — просто
 * считаем по календарю от `servingStartDate`.
 */

import { CrimeCategory, RecidivismKind } from '@domain/enums';
import type {
  Episode,
  RuleApplication,
  UkArticle,
} from '@domain/types';
import { findArticlePart } from '@legal/articles/registry';
import { rule, type RuleId } from '@legal/rules/catalogue';

import type { Range } from '../types';
import { addDuration } from '@legal/detectors/timeline';

const Y = 360;

export interface ParoleInput {
  /** Окончательный срок ЛС (после зачёта). */
  finalRangeAfterZachet: Range;
  /** Дата начала отбытия — для расчёта earliestDate. */
  servingStartDate?: string;
  /** Эпизоды и реестр — для определения «худшей» категории и спец-перечней. */
  episodes: Episode[];
  articles: UkArticle[];
  /** Если назначено пожизненное (ст. 79 ч. 5). */
  isLifeImprisonment?: boolean;
  /** Вид рецидива (для отображения, не влияет на доли). */
  recidivism: RecidivismKind;
}

export interface ParoleResult {
  /** Сколько дней реального отбытия нужно для подачи. */
  daysServedRequired: number;
  /** Самая ранняя дата подачи — если есть servingStartDate. */
  earliestDate?: string;
  /** Применённое правило. */
  ruleId: RuleId;
  /** Для UI / PDF. */
  reason: string;
  log: RuleApplication[];
}

const logRule = (ruleId: RuleId, description: string): RuleApplication => {
  const r = rule(ruleId);
  return { ruleId, norm: r.norm, source: r.source, description };
};

// ────────────────────────────────────────────────────────────────────────────

const CATEGORY_ORDER: CrimeCategory[] = [
  CrimeCategory.Small,
  CrimeCategory.Medium,
  CrimeCategory.Heavy,
  CrimeCategory.EspeciallyHeavy,
];

interface PartsAggregate {
  worst: CrimeCategory;
  hasTerrorism: boolean;
  hasSexualMinor: boolean;
}

function aggregateEpisodes(
  episodes: Episode[],
  articles: UkArticle[],
): PartsAggregate {
  let worst: CrimeCategory = CrimeCategory.Small;
  let hasTerrorism = false;
  let hasSexualMinor = false;
  for (const ep of episodes) {
    const part = findArticlePart(articles, ep.articleNumber, ep.articlePart);
    const c = ep.effectiveCategory ?? part?.category ?? CrimeCategory.Small;
    if (CATEGORY_ORDER.indexOf(c) > CATEGORY_ORDER.indexOf(worst)) worst = c;
    if (part?.isTerrorism) hasTerrorism = true;
    if (part?.isSexualAgainstMinor) hasSexualMinor = true;
  }
  return { worst, hasTerrorism, hasSexualMinor };
}

export function evaluateParole(input: ParoleInput): ParoleResult {
  const log: RuleApplication[] = [];

  // 1. ПЛС → 25 лет реального отбытия.
  if (input.isLifeImprisonment) {
    const required = 25 * Y;
    const earliest = input.servingStartDate
      ? addDuration(input.servingStartDate, { years: 25, months: 0, days: 0 })
      : undefined;
    log.push(
      logRule(
        'O-079-PLS',
        'УДО при пожизненном ЛС: не ранее 25 лет реального отбытия (ст. 79 ч. 5).',
      ),
    );
    return {
      daysServedRequired: required,
      ruleId: 'O-079-PLS',
      reason: 'Пожизненное ЛС: УДО не ранее 25 лет (ст. 79 ч. 5).',
      log,
      ...(earliest ? { earliestDate: earliest } : {}),
    };
  }

  const term = input.finalRangeAfterZachet.max;
  const agg = aggregateEpisodes(input.episodes, input.articles);

  // 2. Спец-перечни идут раньше категории.
  let num = 1;
  let den = 3;
  let ruleId: RuleId = 'O-079-A';

  if (agg.hasSexualMinor) {
    num = 4;
    den = 5;
    ruleId = 'O-079-G';
  } else if (agg.hasTerrorism) {
    num = 3;
    den = 4;
    ruleId = 'O-079-G';
  } else {
    switch (agg.worst) {
      case CrimeCategory.Heavy:
        num = 1;
        den = 2;
        ruleId = 'O-079-B';
        break;
      case CrimeCategory.EspeciallyHeavy:
        num = 2;
        den = 3;
        ruleId = 'O-079-V';
        break;
      default:
        num = 1;
        den = 3;
        ruleId = 'O-079-A';
    }
  }

  const required = Math.ceil((term * num) / den);
  const earliest = input.servingStartDate
    ? addDurationFromDays(input.servingStartDate, required)
    : undefined;

  log.push(
    logRule(
      ruleId,
      `УДО возможно после ${num}/${den} от назначенного срока (${formatTermFraction(num, den)}).`,
    ),
  );

  return {
    daysServedRequired: required,
    ruleId,
    reason: `Доля для УДО: ${num}/${den} от назначенного срока (${formatTermFraction(num, den)}).`,
    log,
    ...(earliest ? { earliestDate: earliest } : {}),
  };
}

function addDurationFromDays(iso: string, totalDays: number): string {
  const years = Math.floor(totalDays / Y);
  const remAfterYears = totalDays - years * Y;
  const months = Math.floor(remAfterYears / 30);
  const days = remAfterYears - months * 30;
  return addDuration(iso, { years, months, days });
}

function formatTermFraction(num: number, den: number): string {
  if (num === 1 && den === 3) return '≥ 1/3';
  if (num === 1 && den === 2) return '≥ 1/2';
  if (num === 2 && den === 3) return '≥ 2/3';
  if (num === 3 && den === 4) return '≥ 3/4';
  if (num === 4 && den === 5) return '≥ 4/5';
  return `≥ ${num}/${den}`;
}

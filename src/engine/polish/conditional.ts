/**
 * Условное осуждение (УК ст. 73, ППВС № 58/2015 пп. 60–62).
 *
 * Условия применимости:
 *   • назначенное реальное наказание — ЛС не более 8 лет;
 *   • НЕТ запретов P-073-DENY:
 *     − опасный или особо опасный рецидив;
 *     − тяжкое / особо тяжкое в период УО или УДО;
 *     − половые преступления против лиц до 14 лет;
 *     − террористические составы из перечня ст. 73 ч. 1.
 *
 * v1: проверяет только формальные запреты по эпизодам и рецидиву.
 * Решение «применять — не применять» остаётся за судом, мы только
 * подсвечиваем доступность.
 */

import { CrimeCategory, RecidivismKind } from '@domain/enums';
import type {
  ArticlePart,
  Conviction,
  Episode,
  RuleApplication,
  UkArticle,
} from '@domain/types';
import { findArticlePart } from '@legal/articles/registry';
import { rule, type RuleId } from '@legal/rules/catalogue';

import type { Range } from '../types';

const Y = 360;

export interface ConditionalInput {
  finalRange: Range;
  recidivism: RecidivismKind;
  episodes: Episode[];
  articles: UkArticle[];
  convictions: Conviction[];
}

export interface ConditionalResult {
  available: boolean;
  blockingRuleId?: RuleId;
  reason: string;
  log: RuleApplication[];
}

const logRule = (
  ruleId: RuleId,
  description: string,
): RuleApplication => {
  const r = rule(ruleId);
  return { ruleId, norm: r.norm, source: r.source, description };
};

// ────────────────────────────────────────────────────────────────────────────

export function evaluateConditional(input: ConditionalInput): ConditionalResult {
  const { finalRange, recidivism, episodes, articles, convictions } = input;
  const log: RuleApplication[] = [];

  // 1. Лимит 8 лет ЛС (по нижней границе диапазона; если min > 8 — невозможно).
  if (finalRange.min > 8 * Y) {
    return {
      available: false,
      blockingRuleId: 'P-073',
      reason: `Минимум диапазона (${Math.floor(finalRange.min / Y)} лет) превышает 8 лет — ст. 73 неприменима.`,
      log: [logRule('P-073', 'Условное осуждение возможно только при ЛС ≤ 8 лет.')],
    };
  }

  // 2. Рецидив опасный / особо опасный → запрет.
  if (
    recidivism === RecidivismKind.Dangerous ||
    recidivism === RecidivismKind.EspeciallyDangerous
  ) {
    return {
      available: false,
      blockingRuleId: 'P-073-DENY',
      reason: `${recidivism === RecidivismKind.Dangerous ? 'Опасный' : 'Особо опасный'} рецидив — ст. 73 не применяется.`,
      log: [logRule('P-073-DENY', 'Опасный/особо опасный рецидив — запрет ст. 73.')],
    };
  }

  // 3. Тяжкое / особо тяжкое в период действия УО / УДО.
  const inUOorParole = convictions.some(
    (c) => c.status === 'conditional' || c.status === 'parole',
  );
  if (inUOorParole) {
    const hasHeavyEpisode = episodes.some((ep) => {
      const part = findArticlePart(articles, ep.articleNumber, ep.articlePart);
      const c = ep.effectiveCategory ?? part?.category;
      return c === CrimeCategory.Heavy || c === CrimeCategory.EspeciallyHeavy;
    });
    if (hasHeavyEpisode) {
      return {
        available: false,
        blockingRuleId: 'P-073-DENY',
        reason: 'Тяжкое / особо тяжкое преступление в период действия УО или УДО — ст. 73 не применяется.',
        log: [
          logRule(
            'P-073-DENY',
            'Тяжкое / особо тяжкое в период УО или УДО — запрет (ст. 73 ч. 1).',
          ),
        ],
      };
    }
  }

  // 4. Половые против лиц до 14 / террор. составы — запрет.
  const blockedByPart = episodes
    .map((ep) => findArticlePart(articles, ep.articleNumber, ep.articlePart))
    .find(
      (p): p is ArticlePart => Boolean(p?.isTerrorism) || Boolean(p?.isSexualAgainstMinor),
    );
  if (blockedByPart) {
    return {
      available: false,
      blockingRuleId: 'P-073-DENY',
      reason: blockedByPart.isTerrorism
        ? 'Состав в перечне террористических — ст. 73 не применяется.'
        : 'Преступление против половой неприкосновенности лица до 14 лет — ст. 73 не применяется.',
      log: [
        logRule(
          'P-073-DENY',
          'Запрет ст. 73 для составов из перечня (террор. / половые против лиц до 14).',
        ),
      ],
    };
  }

  // Доступно
  log.push(
    logRule(
      'P-073',
      'Формальные условия выполнены. Решение о применении — за судом.',
    ),
  );
  return {
    available: true,
    reason: 'Формальные условия выполнены: ЛС ≤ 8 лет, нет запретов рецидива/состава.',
    log,
  };
}

/**
 * Рекомендация по испытательному сроку (ст. 73 ч. 3):
 *   • назначенное ЛС ≤ 1 года → 6 мес. – 3 года
 *   • назначенное ЛС > 1 года → 6 мес. – 5 лет
 */
export function recommendProbation(rangeDays: Range): { minDays: number; maxDays: number } {
  const usedDays = rangeDays.max;
  if (usedDays <= 1 * Y) return { minDays: 6 * 30, maxDays: 3 * Y };
  return { minDays: 6 * 30, maxDays: 5 * Y };
}

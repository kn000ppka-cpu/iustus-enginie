/**
 * Определение вида исправительного учреждения (УК ст. 58, ППВС № 9/2014).
 *
 * Алгоритм по чч. 1 и 3 ст. 58:
 *   1. Если возраст < 18 на дату вынесения — воспитательная колония (ч. 3).
 *   2. Если ПЛС — особый режим.
 *   3. Особо опасный рецидив (T-018) — особый режим (ч. 1 п. «г»).
 *   4. Опасный рецидив; женщины с рецидивом — общий (с особенностями).
 *   5. Строгий режим — мужчины при особо тяжком впервые; рецидив с реальным
 *      отбытием ЛС в прошлом.
 *   6. Общий — мужчины тяжкое впервые; женщины с любым рецидивом (кроме
 *      особо опасного).
 *   7. Колония-поселение — неосторожные / небольшой/средней впервые при ЛС.
 *
 * v1: используем категории эпизодов и текущий вид рецидива. Эпизоды,
 * наказуемые штрафом, обяз. работами и т. п., в расчёт не идут — там нет
 * исправительного учреждения.
 */

import {
  CrimeCategory,
  ConvictionStatus,
  FacilityKind,
  Gender,
  RecidivismKind,
} from '@domain/enums';
import type {
  ArticlePart,
  Conviction,
  Episode,
  Subject,
  UkArticle,
} from '@domain/types';
import { findArticlePart } from '@legal/articles/registry';
import { ageAt } from '@legal/filters/subject-filters';
import { rule, type RuleId } from '@legal/rules/catalogue';
import type { RuleApplication } from '@domain/types';

const CATEGORY_ORDER: CrimeCategory[] = [
  CrimeCategory.Small,
  CrimeCategory.Medium,
  CrimeCategory.Heavy,
  CrimeCategory.EspeciallyHeavy,
];

export interface RegimeInput {
  subject: Subject;
  trialDate: string;
  episodes: Episode[];
  articles: UkArticle[];
  recidivism: RecidivismKind;
  /** Все приговоры — нужен признак «реально отбывал ЛС в прошлом» для строгого. */
  convictions: Conviction[];
  /** Пожизненное было назначено в результате расчёта. */
  isLifeImprisonment?: boolean;
}

export interface RegimeResult {
  facility: FacilityKind;
  /** Применённое правило ст. 58 (одно из P-058-*). */
  ruleId: RuleId;
  /** Объяснение для UI и протокола. */
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

export function determineFacility(input: RegimeInput): RegimeResult {
  const {
    subject,
    trialDate,
    episodes,
    articles,
    recidivism,
    convictions,
    isLifeImprisonment,
  } = input;

  const log: RuleApplication[] = [];

  // 1. Несовершеннолетний на момент вынесения → воспитательная колония.
  if (ageAt(subject.birthDate, trialDate) < 18) {
    const r = logRule(
      'P-058-VOSP',
      'Лицо до 18 лет на момент вынесения приговора (ст. 58 ч. 3 УК) — воспитательная колония.',
    );
    log.push(r);
    return {
      facility: FacilityKind.EducationalColony,
      ruleId: 'P-058-VOSP',
      reason: r.description,
      log,
    };
  }

  // 2. ПЛС → особый режим.
  if (isLifeImprisonment) {
    const r = logRule(
      'P-058-G',
      'Назначено пожизненное лишение свободы — особый режим (ст. 58 ч. 1 п. «г»).',
    );
    log.push(r);
    return { facility: FacilityKind.SpecialRegime, ruleId: 'P-058-G', reason: r.description, log };
  }

  // 3. Особо опасный рецидив → особый режим.
  if (recidivism === RecidivismKind.EspeciallyDangerous) {
    const r = logRule(
      'P-058-G',
      'Особо опасный рецидив (ст. 18 ч. 3) — особый режим (ст. 58 ч. 1 п. «г»).',
    );
    log.push(r);
    return { facility: FacilityKind.SpecialRegime, ruleId: 'P-058-G', reason: r.description, log };
  }

  // Категории эпизодов — для последующих веток.
  const worstCategory = worstEpisodeCategory(episodes, articles);
  const everServedReal = convictions.some(
    (c) =>
      c.status === ConvictionStatus.Served ||
      c.status === ConvictionStatus.PartiallyServed ||
      c.status === ConvictionStatus.Replaced,
  );
  const isMale = subject.gender === Gender.Male;

  // 4. Строгий режим (ст. 58 ч. 1 п. «в»):
  //    мужчины — особо тяжкое впервые; рецидив (если ранее реально отбывал ЛС).
  if (
    isMale &&
    (worstCategory === CrimeCategory.EspeciallyHeavy ||
      (recidivism !== RecidivismKind.None && everServedReal))
  ) {
    const r = logRule(
      'P-058-V',
      worstCategory === CrimeCategory.EspeciallyHeavy
        ? 'Мужчина, осуждённый за особо тяжкое преступление впервые — строгий режим (ст. 58 ч. 1 п. «в»).'
        : 'Мужчина, рецидив + ранее реально отбывал лишение свободы — строгий режим (ст. 58 ч. 1 п. «в»).',
    );
    log.push(r);
    return { facility: FacilityKind.StrictRegime, ruleId: 'P-058-V', reason: r.description, log };
  }

  // 5. Общий режим (ст. 58 ч. 1 п. «б»):
  //    мужчины — тяжкие впервые; женщины при любом рецидиве (кроме особо опасного).
  if (
    (isMale && worstCategory === CrimeCategory.Heavy) ||
    (!isMale && recidivism !== RecidivismKind.None)
  ) {
    const r = logRule(
      'P-058-B',
      isMale
        ? 'Мужчина, тяжкое преступление впервые — общий режим (ст. 58 ч. 1 п. «б»).'
        : 'Женщина с рецидивом (кроме особо опасного) — общий режим (ст. 58 ч. 1 п. «б»).',
    );
    log.push(r);
    return { facility: FacilityKind.GeneralRegime, ruleId: 'P-058-B', reason: r.description, log };
  }

  // 6. Колония-поселение (ст. 58 ч. 1 п. «а»):
  //    неосторожные; небольшой / средней впервые при ЛС.
  if (
    worstCategory === CrimeCategory.Small ||
    worstCategory === CrimeCategory.Medium
  ) {
    const r = logRule(
      'P-058-A',
      'Преступление небольшой / средней тяжести впервые при назначении ЛС — колония-поселение (ст. 58 ч. 1 п. «а»).',
    );
    log.push(r);
    return { facility: FacilityKind.Settlement, ruleId: 'P-058-A', reason: r.description, log };
  }

  // 7. Резервный случай — общий режим.
  const fallback = logRule(
    'P-058-B',
    'По умолчанию (категория не позволила однозначно отнести к строгому/особому/поселению) — общий режим.',
  );
  log.push(fallback);
  return {
    facility: FacilityKind.GeneralRegime,
    ruleId: 'P-058-B',
    reason: fallback.description,
    log,
  };
}

function worstEpisodeCategory(
  episodes: Episode[],
  articles: UkArticle[],
): CrimeCategory {
  if (episodes.length === 0) return CrimeCategory.Small;
  return episodes.reduce<CrimeCategory>((acc, ep) => {
    const part = findArticlePart(articles, ep.articleNumber, ep.articlePart);
    const c = ep.effectiveCategory ?? part?.category ?? CrimeCategory.Small;
    return CATEGORY_ORDER.indexOf(c) > CATEGORY_ORDER.indexOf(acc) ? c : acc;
  }, CrimeCategory.Small);
}

/**
 * Должен ли применяться зачёт «1:1 независимо от режима» (ст. 72 ч. 3.2,
 * P-072-EXCL): особо опасный рецидив либо террор. составы.
 */
export function isOneToOneOnly(input: {
  recidivism: RecidivismKind;
  episodes: Episode[];
  articles: UkArticle[];
}): { applies: boolean; reason: string } {
  if (input.recidivism === RecidivismKind.EspeciallyDangerous) {
    return {
      applies: true,
      reason: 'Особо опасный рецидив — зачёт СИЗО только 1:1 (ст. 72 ч. 3.2).',
    };
  }
  const partWithTerror = input.episodes
    .map((ep) => findArticlePart(input.articles, ep.articleNumber, ep.articlePart))
    .find((p): p is ArticlePart => Boolean(p?.isTerrorism));
  if (partWithTerror) {
    return {
      applies: true,
      reason: `Состав ${partWithTerror.disposition.slice(0, 80)}… в перечне террор./экстремистских — зачёт 1:1.`,
    };
  }
  return { applies: false, reason: '' };
}

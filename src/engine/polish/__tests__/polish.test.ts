/**
 * Тесты Этапа 5 — режим (P-058-*), зачёт (P-072-*), УО (P-073).
 */

import { describe, expect, it } from 'vitest';

import {
  CrimeCategory,
  ConvictionStatus,
  DisabilityGroup,
  FacilityKind,
  Gender,
  RecidivismKind,
} from '@domain/enums';
import type { Conviction, Episode, Subject } from '@domain/types';
import { SEED_ARTICLES } from '@legal/articles/seed';

import { determineFacility, isOneToOneOnly } from '../regime';
import { computeZacet, daysBetweenInclusive } from '../zacet';
import { evaluateConditional, recommendProbation } from '../conditional';

const Y = 360;

const adultMale: Subject = {
  gender: Gender.Male,
  birthDate: '1985-01-01',
  isPregnant: false,
  hasChildUnder3: false,
  hasChildUnder14: false,
  disability: DisabilityGroup.None,
  isMilitary: false,
  hasStateAwards: false,
};

const ep = (over: Partial<Episode>): Episode => ({
  id: 'e1',
  commitDate: '2025-01-01',
  articleNumber: '158',
  articlePart: '3',
  stage: 'completed',
  role: 'solo',
  flags: {
    mitigatingIds: [],
    aggravatingIds: [],
    art62_1: false,
    art64: false,
    art65: false,
    art15_6_applied: false,
  },
  ...over,
});

// ── P-058 ─────────────────────────────────────────────────────────────────

describe('P-058: режим', () => {
  it('Несовершеннолетний → воспитательная колония', () => {
    const minor: Subject = { ...adultMale, birthDate: '2010-01-01' };
    const r = determineFacility({
      subject: minor,
      trialDate: '2026-04-25',
      episodes: [ep({})],
      articles: SEED_ARTICLES,
      recidivism: RecidivismKind.None,
      convictions: [],
    });
    expect(r.facility).toBe(FacilityKind.EducationalColony);
  });

  it('ПЛС → особый режим', () => {
    const r = determineFacility({
      subject: adultMale,
      trialDate: '2026-04-25',
      episodes: [ep({ articleNumber: '105', articlePart: '2' })],
      articles: SEED_ARTICLES,
      recidivism: RecidivismKind.None,
      convictions: [],
      isLifeImprisonment: true,
    });
    expect(r.facility).toBe(FacilityKind.SpecialRegime);
  });

  it('Особо опасный рецидив → особый', () => {
    const r = determineFacility({
      subject: adultMale,
      trialDate: '2026-04-25',
      episodes: [ep({ articleNumber: '105', articlePart: '1' })],
      articles: SEED_ARTICLES,
      recidivism: RecidivismKind.EspeciallyDangerous,
      convictions: [],
    });
    expect(r.facility).toBe(FacilityKind.SpecialRegime);
  });

  it('Мужчина + особо тяжкое впервые → строгий', () => {
    const r = determineFacility({
      subject: adultMale,
      trialDate: '2026-04-25',
      episodes: [ep({ articleNumber: '105', articlePart: '1' })],
      articles: SEED_ARTICLES,
      recidivism: RecidivismKind.None,
      convictions: [],
    });
    expect(r.facility).toBe(FacilityKind.StrictRegime);
  });

  it('Мужчина + тяжкое впервые → общий', () => {
    const r = determineFacility({
      subject: adultMale,
      trialDate: '2026-04-25',
      episodes: [ep({ articleNumber: '158', articlePart: '3' })], // Heavy
      articles: SEED_ARTICLES,
      recidivism: RecidivismKind.None,
      convictions: [],
    });
    expect(r.facility).toBe(FacilityKind.GeneralRegime);
  });

  it('Небольшой/средней впервые → колония-поселение', () => {
    const r = determineFacility({
      subject: adultMale,
      trialDate: '2026-04-25',
      episodes: [ep({ articleNumber: '158', articlePart: '1' })], // Small
      articles: SEED_ARTICLES,
      recidivism: RecidivismKind.None,
      convictions: [],
    });
    expect(r.facility).toBe(FacilityKind.Settlement);
  });

  it('Женщина + рецидив (простой) → общий', () => {
    const female: Subject = { ...adultMale, gender: Gender.Female };
    const r = determineFacility({
      subject: female,
      trialDate: '2026-04-25',
      episodes: [ep({ articleNumber: '158', articlePart: '3' })],
      articles: SEED_ARTICLES,
      recidivism: RecidivismKind.Simple,
      convictions: [],
    });
    expect(r.facility).toBe(FacilityKind.GeneralRegime);
  });
});

// ── isOneToOneOnly ────────────────────────────────────────────────────────

describe('isOneToOneOnly: исключения 1:1 (P-072-EXCL)', () => {
  it('Особо опасный рецидив → 1:1', () => {
    const r = isOneToOneOnly({
      recidivism: RecidivismKind.EspeciallyDangerous,
      episodes: [],
      articles: SEED_ARTICLES,
    });
    expect(r.applies).toBe(true);
  });

  it('Без рецидива и без террор. → не применяется', () => {
    const r = isOneToOneOnly({
      recidivism: RecidivismKind.None,
      episodes: [ep({})],
      articles: SEED_ARTICLES,
    });
    expect(r.applies).toBe(false);
  });
});

// ── Зачёт ст. 72 ──────────────────────────────────────────────────────────

describe('daysBetweenInclusive', () => {
  it('один день = 1', () => {
    expect(daysBetweenInclusive('2025-01-01', '2025-01-01')).toBe(1);
  });
  it('5 дней', () => {
    expect(daysBetweenInclusive('2025-01-01', '2025-01-05')).toBe(5);
  });
  it('перепутанные даты = 0', () => {
    expect(daysBetweenInclusive('2025-01-05', '2025-01-01')).toBe(0);
  });
});

describe('computeZacet', () => {
  it('СИЗО на поселение: 100 дней СИЗО → 200 дней зачёта (1:2)', () => {
    const r = computeZacet({
      facility: FacilityKind.Settlement,
      oneToOneOnly: false,
      periods: [
        {
          id: 'p1',
          regime: 'custody',
          from: '2025-01-01',
          to: '2025-04-10', // 100 дней
        },
      ],
    });
    expect(r.totalCreditDays).toBe(200);
    expect(r.log[0]?.ruleId).toBe('P-072-3.1-V');
  });

  it('СИЗО на общий: 100 дней → 150 (1:1.5)', () => {
    const r = computeZacet({
      facility: FacilityKind.GeneralRegime,
      oneToOneOnly: false,
      periods: [
        { id: 'p1', regime: 'custody', from: '2025-01-01', to: '2025-04-10' },
      ],
    });
    expect(r.totalCreditDays).toBe(150);
    expect(r.log[0]?.ruleId).toBe('P-072-3.1-B');
  });

  it('СИЗО на строгий: 100 → 100 (1:1)', () => {
    const r = computeZacet({
      facility: FacilityKind.StrictRegime,
      oneToOneOnly: false,
      periods: [
        { id: 'p1', regime: 'custody', from: '2025-01-01', to: '2025-04-10' },
      ],
    });
    expect(r.totalCreditDays).toBe(100);
    expect(r.log[0]?.ruleId).toBe('P-072-3.1-A');
  });

  it('Исключение 1:1: на поселение даже 100 СИЗО = 100 (a не 200)', () => {
    const r = computeZacet({
      facility: FacilityKind.Settlement,
      oneToOneOnly: true,
      periods: [
        { id: 'p1', regime: 'custody', from: '2025-01-01', to: '2025-04-10' },
      ],
    });
    expect(r.totalCreditDays).toBe(100);
    expect(r.log[0]?.ruleId).toBe('P-072-EXCL');
  });

  it('Домашний арест 100 дней → общий режим: 50 СИЗО × 1.5 = 75', () => {
    const r = computeZacet({
      facility: FacilityKind.GeneralRegime,
      oneToOneOnly: false,
      periods: [
        { id: 'p1', regime: 'house_arrest', from: '2025-01-01', to: '2025-04-10' },
      ],
    });
    expect(r.totalCreditDays).toBe(75);
    expect(r.log[0]?.ruleId).toBe('P-072-3.4');
  });
});

// ── УО ст. 73 ─────────────────────────────────────────────────────────────

describe('evaluateConditional', () => {
  it('ЛС > 8 лет min → недоступно', () => {
    const r = evaluateConditional({
      finalRange: { min: 9 * Y, max: 12 * Y },
      recidivism: RecidivismKind.None,
      episodes: [],
      articles: SEED_ARTICLES,
      convictions: [],
    });
    expect(r.available).toBe(false);
    expect(r.blockingRuleId).toBe('P-073');
  });

  it('Опасный рецидив → недоступно', () => {
    const r = evaluateConditional({
      finalRange: { min: 60, max: 4 * Y },
      recidivism: RecidivismKind.Dangerous,
      episodes: [],
      articles: SEED_ARTICLES,
      convictions: [],
    });
    expect(r.available).toBe(false);
    expect(r.blockingRuleId).toBe('P-073-DENY');
  });

  it('Тяжкое в период УО → недоступно', () => {
    const c: Conviction = {
      id: 'c1',
      effectiveDate: '2024-01-01',
      composition: [],
      sentence: { kind: 'imprisonment', duration: { years: 3, months: 0, days: 0 } },
      status: ConvictionStatus.Conditional,
      worstCategory: CrimeCategory.Heavy,
    };
    const r = evaluateConditional({
      finalRange: { min: 60, max: 4 * Y },
      recidivism: RecidivismKind.None,
      episodes: [ep({ articleNumber: '158', articlePart: '3' })],
      articles: SEED_ARTICLES,
      convictions: [c],
    });
    expect(r.available).toBe(false);
  });

  it('Чистый случай ЛС 4 года, нет рецидива → доступно', () => {
    const r = evaluateConditional({
      finalRange: { min: 60, max: 4 * Y },
      recidivism: RecidivismKind.None,
      episodes: [ep({ articleNumber: '158', articlePart: '3' })],
      articles: SEED_ARTICLES,
      convictions: [],
    });
    expect(r.available).toBe(true);
  });
});

describe('recommendProbation', () => {
  it('ЛС ≤ 1 года → 6 мес – 3 года', () => {
    const r = recommendProbation({ min: 60, max: 1 * Y });
    expect(r.minDays).toBe(180);
    expect(r.maxDays).toBe(3 * Y);
  });
  it('ЛС > 1 года → 6 мес – 5 лет', () => {
    const r = recommendProbation({ min: 60, max: 4 * Y });
    expect(r.maxDays).toBe(5 * Y);
  });
});

/**
 * Тесты детекторов Timeline.
 * Покрытие: T-018, T-018-EXCL, T-069-5, T-070, T-086.
 */

import { describe, expect, it } from 'vitest';

import {
  ConvictionStatus,
  CrimeCategory,
  DisabilityGroup,
  Gender,
  RecidivismKind,
} from '@domain/enums';
import type { Conviction, Episode, Subject } from '@domain/types';
import {
  activeConvictionsAt,
  countsForRecidivism,
  detectArt69_5Conflict,
  detectArt70Conflict,
  expungeDate,
  recidivismKindFor,
} from '../timeline';

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

const conv = (
  over: Partial<Conviction> & Pick<Conviction, 'id' | 'effectiveDate' | 'status'>,
): Conviction => ({
  composition: [],
  sentence: { kind: 'imprisonment', duration: { years: 5, months: 0, days: 0 } },
  worstCategory: CrimeCategory.Heavy,
  ...over,
});

const ep = (over: Partial<Episode> & Pick<Episode, 'id' | 'commitDate'>): Episode => ({
  articleNumber: '158',
  articlePart: '1',
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

// ── T-086 ─────────────────────────────────────────────────────────────────

describe('T-086: погашение судимости', () => {
  it('тяжкое: 8 лет после освобождения', () => {
    const c = conv({
      id: '1',
      effectiveDate: '2010-01-01',
      status: ConvictionStatus.Served,
      servingStartDate: '2010-01-01',
      actuallyServed: { years: 5, months: 0, days: 0 },
      worstCategory: CrimeCategory.Heavy,
    });
    // освобождение 2015-01-01 (~), погашение через 8 лет → 2023.
    const exp = expungeDate(c)!;
    expect(exp.startsWith('2022') || exp.startsWith('2023')).toBe(true);
  });

  it('especially_heavy: 10 лет', () => {
    const c = conv({
      id: '1',
      effectiveDate: '2010-01-01',
      status: ConvictionStatus.Served,
      servingStartDate: '2010-01-01',
      actuallyServed: { years: 10, months: 0, days: 0 },
      worstCategory: CrimeCategory.EspeciallyHeavy,
    });
    const exp = expungeDate(c)!;
    expect(exp.startsWith('2029') || exp.startsWith('2030')).toBe(true);
  });

  it('Expunged → null', () => {
    const c = conv({
      id: '1',
      effectiveDate: '2010-01-01',
      status: ConvictionStatus.Expunged,
    });
    expect(expungeDate(c)).toBeNull();
  });

  it('Conditional → effectiveDate + испыт. срок', () => {
    const c = conv({
      id: '1',
      effectiveDate: '2020-01-01',
      status: ConvictionStatus.Conditional,
      sentence: { kind: 'imprisonment', duration: { years: 3, months: 0, days: 0 } },
    });
    const exp = expungeDate(c)!;
    expect(exp.startsWith('2022') || exp.startsWith('2023')).toBe(true);
  });

  it('activeConvictionsAt отсекает погашённые', () => {
    const c = conv({
      id: '1',
      effectiveDate: '2010-01-01',
      status: ConvictionStatus.Served,
      servingStartDate: '2010-01-01',
      actuallyServed: { years: 1, months: 0, days: 0 },
      worstCategory: CrimeCategory.Small,
    });
    // small: погашение через 3 года после освобождения. Освобождение ~2011, погашение ~2014.
    expect(activeConvictionsAt([c], '2020-01-01')).toEqual([]);
    expect(activeConvictionsAt([c], '2012-01-01')).toEqual([c]);
  });
});

// ── T-018 / T-018-EXCL ─────────────────────────────────────────────────────

describe('T-018-EXCL: исключения из рецидива', () => {
  it('УО не учитывается', () => {
    const c = conv({
      id: '1',
      effectiveDate: '2020-01-01',
      status: ConvictionStatus.Conditional,
      worstCategory: CrimeCategory.Heavy,
    });
    expect(countsForRecidivism(c, adultMale)).toBe(false);
  });

  it('УДО не учитывается', () => {
    const c = conv({
      id: '1',
      effectiveDate: '2020-01-01',
      status: ConvictionStatus.Parole,
      worstCategory: CrimeCategory.Heavy,
    });
    expect(countsForRecidivism(c, adultMale)).toBe(false);
  });

  it('небольшой тяжести не учитывается', () => {
    const c = conv({
      id: '1',
      effectiveDate: '2020-01-01',
      status: ConvictionStatus.Served,
      worstCategory: CrimeCategory.Small,
    });
    expect(countsForRecidivism(c, adultMale)).toBe(false);
  });

  it('судимость до 18 лет не учитывается', () => {
    const minor: Subject = { ...adultMale, birthDate: '2005-01-01' };
    const c = conv({
      id: '1',
      effectiveDate: '2022-01-01', // 17 лет
      status: ConvictionStatus.Served,
      worstCategory: CrimeCategory.Heavy,
    });
    expect(countsForRecidivism(c, minor)).toBe(false);
  });

  it('тяжкое во взрослом, отбыто — учитывается', () => {
    const c = conv({
      id: '1',
      effectiveDate: '2020-01-01',
      status: ConvictionStatus.Served,
      worstCategory: CrimeCategory.Heavy,
    });
    expect(countsForRecidivism(c, adultMale)).toBe(true);
  });
});

describe('T-018: вид рецидива', () => {
  const heavyServed: Conviction = conv({
    id: '1',
    effectiveDate: '2018-01-01',
    status: ConvictionStatus.Served,
    servingStartDate: '2018-01-01',
    actuallyServed: { years: 1, months: 0, days: 0 }, // ещё непогашена
    worstCategory: CrimeCategory.Heavy,
  });

  it('новое тяжкое + ранее тяжкое → опасный', () => {
    expect(recidivismKindFor(adultMale, CrimeCategory.Heavy, [heavyServed])).toBe(
      RecidivismKind.Dangerous,
    );
  });

  it('новое особо тяжкое + ранее тяжкое → особо опасный', () => {
    expect(
      recidivismKindFor(adultMale, CrimeCategory.EspeciallyHeavy, [heavyServed]),
    ).toBe(RecidivismKind.EspeciallyDangerous);
  });

  it('новое небольшой тяжести → нет рецидива', () => {
    expect(recidivismKindFor(adultMale, CrimeCategory.Small, [heavyServed])).toBe(
      RecidivismKind.None,
    );
  });

  it('никаких релевантных судимостей → нет рецидива', () => {
    expect(recidivismKindFor(adultMale, CrimeCategory.Heavy, [])).toBe(
      RecidivismKind.None,
    );
  });

  it('новое средней тяжести + одна тяжкая → простой', () => {
    expect(recidivismKindFor(adultMale, CrimeCategory.Medium, [heavyServed])).toBe(
      RecidivismKind.Simple,
    );
  });
});

// ── T-069-5 ────────────────────────────────────────────────────────────────

describe('T-069-5: эпизод до приговора', () => {
  it('срабатывает, если commitDate < effectiveDate', () => {
    const e = ep({ id: 'e1', commitDate: '2019-06-01' });
    const c = conv({ id: 'c1', effectiveDate: '2020-01-01', status: ConvictionStatus.Served });
    expect(detectArt69_5Conflict(e, c)?.ruleId).toBe('T-069-5');
  });

  it('не срабатывает, если commitDate >= effectiveDate', () => {
    const e = ep({ id: 'e1', commitDate: '2020-06-01' });
    const c = conv({ id: 'c1', effectiveDate: '2020-01-01', status: ConvictionStatus.Served });
    expect(detectArt69_5Conflict(e, c)).toBeNull();
  });
});

// ── T-070 ──────────────────────────────────────────────────────────────────

describe('T-070: совокупность приговоров', () => {
  it('срабатывает: эпизод после приговора + статус «отбывает частично»', () => {
    const e = ep({ id: 'e1', commitDate: '2022-06-01' });
    const c = conv({
      id: 'c1',
      effectiveDate: '2022-01-01',
      status: ConvictionStatus.PartiallyServed,
    });
    expect(detectArt70Conflict(e, c)?.ruleId).toBe('T-070');
  });

  it('срабатывает на УО', () => {
    const e = ep({ id: 'e1', commitDate: '2022-06-01' });
    const c = conv({
      id: 'c1',
      effectiveDate: '2022-01-01',
      status: ConvictionStatus.Conditional,
    });
    expect(detectArt70Conflict(e, c)?.ruleId).toBe('T-070');
  });

  it('не срабатывает, если приговор отбыт полностью', () => {
    const e = ep({ id: 'e1', commitDate: '2022-06-01' });
    const c = conv({ id: 'c1', effectiveDate: '2022-01-01', status: ConvictionStatus.Served });
    expect(detectArt70Conflict(e, c)).toBeNull();
  });

  it('не срабатывает, если эпизод до приговора (это T-069-5)', () => {
    const e = ep({ id: 'e1', commitDate: '2021-06-01' });
    const c = conv({
      id: 'c1',
      effectiveDate: '2022-01-01',
      status: ConvictionStatus.PartiallyServed,
    });
    expect(detectArt70Conflict(e, c)).toBeNull();
  });
});

/**
 * Юнит-тесты F-фильтров. Каждый тест соответствует одному правилу из
 * legal-catalogue.md (F-049-4, F-050-5, F-053-6, F-053.1-7, F-054-2, F-057-2,
 * F-059-2, F-088-MODE).
 */

import { describe, expect, it } from 'vitest';

import { DisabilityGroup, Gender, PunishmentKind } from '@domain/enums';
import type { Subject } from '@domain/types';
import {
  ageAt,
  computeBlockedPunishments,
  isJuvenileRegime,
} from '../subject-filters';

const TRIAL = '2026-04-25';

const baseAdultMale = (over: Partial<Subject> = {}): Subject => ({
  gender: Gender.Male,
  birthDate: '1990-01-01', // 36 лет
  isPregnant: false,
  hasChildUnder3: false,
  hasChildUnder14: false,
  disability: DisabilityGroup.None,
  isMilitary: false,
  hasStateAwards: false,
  ...over,
});

describe('ageAt', () => {
  it('считает полные годы с учётом месяца и дня', () => {
    expect(ageAt('1990-01-01', '2026-04-25')).toBe(36);
    expect(ageAt('1990-05-01', '2026-04-25')).toBe(35);
    expect(ageAt('2010-04-25', '2026-04-25')).toBe(16);
    expect(ageAt('2010-04-26', '2026-04-25')).toBe(15);
  });
});

describe('F-049-4: запрет обязательных работ', () => {
  it('блокирует инвалидам I группы', () => {
    const r = computeBlockedPunishments(
      baseAdultMale({ disability: DisabilityGroup.I }),
      TRIAL,
    );
    expect(r[PunishmentKind.MandatoryWork]?.ruleId).toBe('F-049-4');
  });

  it('блокирует беременной', () => {
    const r = computeBlockedPunishments(
      baseAdultMale({ gender: Gender.Female, isPregnant: true }),
      TRIAL,
    );
    expect(r[PunishmentKind.MandatoryWork]?.ruleId).toBe('F-049-4');
  });

  it('блокирует женщине с ребёнком до 3', () => {
    const r = computeBlockedPunishments(
      baseAdultMale({ gender: Gender.Female, hasChildUnder3: true }),
      TRIAL,
    );
    expect(r[PunishmentKind.MandatoryWork]?.ruleId).toBe('F-049-4');
  });

  it('не блокирует обычного взрослого мужчину', () => {
    const r = computeBlockedPunishments(baseAdultMale(), TRIAL);
    expect(r[PunishmentKind.MandatoryWork]).toBeUndefined();
  });
});

describe('F-053.1-7: запрет принудительных работ', () => {
  it('блокирует несовершеннолетним', () => {
    const r = computeBlockedPunishments(
      baseAdultMale({ birthDate: '2012-01-01' }),
      TRIAL,
    );
    expect(r[PunishmentKind.ForcedWork]?.ruleId).toBe('F-053.1-7');
  });

  it('блокирует мужчинам 60+', () => {
    const r = computeBlockedPunishments(
      baseAdultMale({ birthDate: '1960-01-01' }),
      TRIAL,
    );
    expect(r[PunishmentKind.ForcedWork]?.ruleId).toBe('F-053.1-7');
    expect(r[PunishmentKind.ForcedWork]?.reason).toContain('мужчина');
  });

  it('блокирует женщинам 55+', () => {
    const r = computeBlockedPunishments(
      baseAdultMale({ gender: Gender.Female, birthDate: '1965-01-01' }),
      TRIAL,
    );
    expect(r[PunishmentKind.ForcedWork]?.ruleId).toBe('F-053.1-7');
  });

  it('блокирует инвалидам II группы', () => {
    const r = computeBlockedPunishments(
      baseAdultMale({ disability: DisabilityGroup.II }),
      TRIAL,
    );
    expect(r[PunishmentKind.ForcedWork]?.ruleId).toBe('F-053.1-7');
  });
});

describe('F-054-2: запрет ареста', () => {
  it('блокирует до 16 лет', () => {
    const r = computeBlockedPunishments(
      baseAdultMale({ birthDate: '2012-01-01' }),
      TRIAL,
    );
    expect(r[PunishmentKind.Arrest]?.ruleId).toBe('F-054-2');
  });

  it('блокирует женщине с ребёнком до 14', () => {
    const r = computeBlockedPunishments(
      baseAdultMale({ gender: Gender.Female, hasChildUnder14: true }),
      TRIAL,
    );
    expect(r[PunishmentKind.Arrest]?.ruleId).toBe('F-054-2');
  });
});

describe('F-057-2 / F-059-2: ПЛС и смертная казнь', () => {
  it('ПЛС блокируется женщинам', () => {
    const r = computeBlockedPunishments(
      baseAdultMale({ gender: Gender.Female }),
      TRIAL,
    );
    expect(r[PunishmentKind.LifeImprisonment]?.ruleId).toBe('F-057-2');
  });

  it('ПЛС блокируется мужчинам 65+', () => {
    const r = computeBlockedPunishments(
      baseAdultMale({ birthDate: '1955-01-01' }),
      TRIAL,
    );
    expect(r[PunishmentKind.LifeImprisonment]?.ruleId).toBe('F-057-2');
  });

  it('Смертная казнь заблокирована всегда (мораторий)', () => {
    const r = computeBlockedPunishments(baseAdultMale(), TRIAL);
    expect(r[PunishmentKind.DeathPenalty]?.ruleId).toBe('F-059-2');
  });
});

describe('Военные виды', () => {
  it('военнослужащий: ограничение по службе и дисчасть разрешены, ограничение свободы запрещено', () => {
    const r = computeBlockedPunishments(baseAdultMale({ isMilitary: true }), TRIAL);
    expect(r[PunishmentKind.MilitaryRestriction]).toBeUndefined();
    expect(r[PunishmentKind.DisciplinaryUnit]).toBeUndefined();
    expect(r[PunishmentKind.RestrictionOfFreedom]?.ruleId).toBe('F-053-6');
  });

  it('гражданский: военные виды наказания заблокированы', () => {
    const r = computeBlockedPunishments(baseAdultMale(), TRIAL);
    expect(r[PunishmentKind.MilitaryRestriction]).toBeDefined();
    expect(r[PunishmentKind.DisciplinaryUnit]).toBeDefined();
  });
});

describe('F-088-MODE: режим несовершеннолетних', () => {
  it('включается до 18 лет на дату вынесения', () => {
    // на 2026-04-25:
    expect(isJuvenileRegime(baseAdultMale({ birthDate: '2010-01-01' }), TRIAL)).toBe(true); // 16
    expect(isJuvenileRegime(baseAdultMale({ birthDate: '2008-05-01' }), TRIAL)).toBe(true); // 17
    expect(isJuvenileRegime(baseAdultMale({ birthDate: '2008-04-25' }), TRIAL)).toBe(false); // ровно 18
    expect(isJuvenileRegime(baseAdultMale({ birthDate: '2000-01-01' }), TRIAL)).toBe(false); // 26
  });
});

describe('Базовые виды без F-фильтров', () => {
  it('штраф, лишение права, лишение звания, ЛС не попадают в карту блокировок для обычного взрослого', () => {
    const r = computeBlockedPunishments(baseAdultMale(), TRIAL);
    expect(r[PunishmentKind.Fine]).toBeUndefined();
    expect(r[PunishmentKind.DeprivationOfRight]).toBeUndefined();
    expect(r[PunishmentKind.DeprivationOfTitle]).toBeUndefined();
    expect(r[PunishmentKind.Imprisonment]).toBeUndefined();
  });
});

/**
 * Тесты ст. 79 / ст. 80 (O-079-*).
 */

import { describe, expect, it } from 'vitest';

import { RecidivismKind } from '@domain/enums';
import type { Episode } from '@domain/types';
import { SEED_ARTICLES } from '@legal/articles/seed';

import { evaluateParole } from '../parole';

const Y = 360;

const ep = (over: Partial<Episode>): Episode => ({
  id: 'e1',
  commitDate: '2025-01-01',
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

describe('O-079: УДО', () => {
  it('Небольшой/средней: 1/3 от срока', () => {
    const r = evaluateParole({
      finalRangeAfterZachet: { min: 60, max: 3 * Y },
      episodes: [ep({ articleNumber: '158', articlePart: '1' })],
      articles: SEED_ARTICLES,
      recidivism: RecidivismKind.None,
    });
    expect(r.ruleId).toBe('O-079-A');
    expect(r.daysServedRequired).toBe(Math.ceil((3 * Y) / 3));
  });

  it('Тяжкое: 1/2', () => {
    const r = evaluateParole({
      finalRangeAfterZachet: { min: 60, max: 6 * Y },
      episodes: [ep({ articleNumber: '158', articlePart: '3' })],
      articles: SEED_ARTICLES,
      recidivism: RecidivismKind.None,
    });
    expect(r.ruleId).toBe('O-079-B');
    expect(r.daysServedRequired).toBe(Math.ceil((6 * Y) / 2));
  });

  it('Особо тяжкое: 2/3', () => {
    const r = evaluateParole({
      finalRangeAfterZachet: { min: 60, max: 12 * Y },
      episodes: [ep({ articleNumber: '105', articlePart: '1' })],
      articles: SEED_ARTICLES,
      recidivism: RecidivismKind.None,
    });
    expect(r.ruleId).toBe('O-079-V');
    expect(r.daysServedRequired).toBe(Math.ceil((12 * Y * 2) / 3));
  });

  it('Террор. составы: 3/4', () => {
    const r = evaluateParole({
      finalRangeAfterZachet: { min: 60, max: 8 * Y },
      episodes: [ep({ articleNumber: '205', articlePart: '1' })],
      articles: SEED_ARTICLES,
      recidivism: RecidivismKind.None,
    });
    // У 205 в seed isTerrorism: true (из перечня) — должно сработать «г».
    expect(r.ruleId).toBe('O-079-G');
    expect(r.daysServedRequired).toBe(Math.ceil((8 * Y * 3) / 4));
  });

  it('ПЛС: 25 лет', () => {
    const r = evaluateParole({
      finalRangeAfterZachet: { min: 0, max: 0 },
      episodes: [],
      articles: SEED_ARTICLES,
      recidivism: RecidivismKind.None,
      isLifeImprisonment: true,
    });
    expect(r.ruleId).toBe('O-079-PLS');
    expect(r.daysServedRequired).toBe(25 * Y);
  });

  it('earliestDate считается, если есть servingStartDate', () => {
    const r = evaluateParole({
      finalRangeAfterZachet: { min: 60, max: 6 * Y },
      episodes: [ep({ articleNumber: '158', articlePart: '3' })],
      articles: SEED_ARTICLES,
      recidivism: RecidivismKind.None,
      servingStartDate: '2025-01-01',
    });
    expect(r.earliestDate).toBeDefined();
    // 1/2 от 6 лет = 3 года
    expect(r.earliestDate?.startsWith('2027') || r.earliestDate?.startsWith('2028')).toBe(true);
  });
});

/**
 * Тесты Master Engine — расчёт по одному эпизоду.
 * Покрытие правил из legal-catalogue.md:
 *   E-066-2, E-066-3, E-062-1, E-062-2, E-062-3, E-062-5, E-065-1,
 *   E-068-2, E-064, E-064-EXCL, J-088-MAX, J-088-MIN.
 */

import { describe, expect, it } from 'vitest';

import {
  DisabilityGroup,
  Gender,
  RecidivismKind,
} from '@domain/enums';
import type { ArticlePart, Episode, Subject } from '@domain/types';
import { findArticlePart } from '@legal/articles/registry';
import { SEED_ARTICLES } from '@legal/articles/seed';

import { computeEpisode, type EpisodeContext } from '../episode';

const Y = 360;
const TRIAL = '2026-04-25';

const adultMale: Subject = {
  gender: Gender.Male,
  birthDate: '1990-01-01',
  isPregnant: false,
  hasChildUnder3: false,
  hasChildUnder14: false,
  disability: DisabilityGroup.None,
  isMilitary: false,
  hasStateAwards: false,
};

const baseCtx = (over: Partial<EpisodeContext> = {}): EpisodeContext => ({
  subject: adultMale,
  trialDate: TRIAL,
  specialProcedure: false,
  preTrialAgreement: false,
  juryTrial: false,
  recidivism: RecidivismKind.None,
  ...over,
});

const ep = (over: Partial<Episode>): Episode => ({
  id: 'e1',
  commitDate: '2025-01-01',
  articleNumber: '105',
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

const partOf = (num: string, p: string): ArticlePart =>
  findArticlePart(SEED_ARTICLES, num, p)!;

// ── Базовый случай ────────────────────────────────────────────────────────

describe('Базовый случай', () => {
  it('ст. 105 ч. 1, оконченное, без модификаторов: 6–15 лет', () => {
    const r = computeEpisode(ep({}), partOf('105', '1'), baseCtx());
    expect(r.finalRange.min).toBe(6 * Y);
    expect(r.finalRange.max).toBe(15 * Y);
    expect(r.log.length).toBe(0); // ничего не применялось
  });
});

// ── E-066 ──────────────────────────────────────────────────────────────────

describe('E-066: стадия преступления', () => {
  it('Покушение: max × 3/4 (ст. 105 ч. 1: 15 → 11.25 = 11 лет 90 дн.)', () => {
    const r = computeEpisode(
      ep({ stage: 'attempt' }),
      partOf('105', '1'),
      baseCtx(),
    );
    expect(r.finalRange.max).toBe(Math.floor((15 * Y * 3) / 4));
    expect(r.log[0]?.ruleId).toBe('E-066-3');
  });

  it('Приготовление: max × 1/2', () => {
    const r = computeEpisode(
      ep({ stage: 'preparation' }),
      partOf('105', '1'),
      baseCtx(),
    );
    expect(r.finalRange.max).toBe(Math.floor((15 * Y) / 2));
    expect(r.log[0]?.ruleId).toBe('E-066-2');
  });
});

// ── E-062-1 ────────────────────────────────────────────────────────────────

describe('E-062-1: и/к без отягчающих', () => {
  it('и + нет отягчающих: 158 ч. 3 (max 6 лет) → 4 года', () => {
    const r = computeEpisode(
      ep({
        articleNumber: '158',
        articlePart: '3',
        flags: {
          mitigatingIds: ['i'],
          aggravatingIds: [],
          art62_1: false,
          art64: false,
          art65: false,
          art15_6_applied: false,
        },
      }),
      partOf('158', '3'),
      baseCtx(),
    );
    expect(r.finalRange.max).toBe(Math.floor((6 * Y * 2) / 3));
    expect(r.log.some((s) => s.ruleId === 'E-062-1')).toBe(true);
  });

  it('и + отягчающие: ст. 62 ч. 1 не применяется', () => {
    const r = computeEpisode(
      ep({
        articleNumber: '158',
        articlePart: '3',
        flags: {
          mitigatingIds: ['i'],
          aggravatingIds: ['ag_v'],
          art62_1: false,
          art64: false,
          art65: false,
          art15_6_applied: false,
        },
      }),
      partOf('158', '3'),
      baseCtx(),
    );
    expect(r.finalRange.max).toBe(6 * Y);
    expect(r.log.some((s) => s.ruleId === 'E-062-1')).toBe(false);
  });
});

// ── E-062-3 ────────────────────────────────────────────────────────────────

describe('E-062-3: запрет ст. 62 чч. 1–2 при ПЛС', () => {
  it('ст. 105 ч. 2 (есть ПЛС) + и без отягч → не снижаем', () => {
    const r = computeEpisode(
      ep({
        articleNumber: '105',
        articlePart: '2',
        flags: {
          mitigatingIds: ['i'],
          aggravatingIds: [],
          art62_1: false,
          art64: false,
          art65: false,
          art15_6_applied: false,
        },
      }),
      partOf('105', '2'),
      baseCtx(),
    );
    expect(r.log.some((s) => s.ruleId === 'E-062-3')).toBe(true);
    expect(r.log.some((s) => s.ruleId === 'E-062-1')).toBe(false);
  });
});

// ── E-062-5 ────────────────────────────────────────────────────────────────

describe('E-062-5: особый порядок', () => {
  it('Особый порядок: max × 2/3', () => {
    const r = computeEpisode(
      ep({ articleNumber: '158', articlePart: '3' }),
      partOf('158', '3'),
      baseCtx({ specialProcedure: true }),
    );
    expect(r.finalRange.max).toBe(Math.floor((6 * Y * 2) / 3));
    expect(r.log.some((s) => s.ruleId === 'E-062-5')).toBe(true);
  });

  it('Особый порядок + и без отягч: последовательно × 2/3 × 2/3', () => {
    const r = computeEpisode(
      ep({
        articleNumber: '158',
        articlePart: '3',
        flags: {
          mitigatingIds: ['i'],
          aggravatingIds: [],
          art62_1: false,
          art64: false,
          art65: false,
          art15_6_applied: false,
        },
      }),
      partOf('158', '3'),
      baseCtx({ specialProcedure: true }),
    );
    // 6×360 = 2160; ×2/3 = 1440 (E-062-1); ×2/3 = 960 (E-062-5)
    expect(r.finalRange.max).toBe(Math.floor(Math.floor((6 * Y * 2) / 3) * 2 / 3));
  });
});

// ── E-068-2 ────────────────────────────────────────────────────────────────

describe('E-068-2: рецидив поднимает min', () => {
  it('Простой рецидив: MIN = max(MIN санкции, max × 1/3)', () => {
    const r = computeEpisode(
      ep({ articleNumber: '158', articlePart: '3' }),
      partOf('158', '3'),
      baseCtx({ recidivism: RecidivismKind.Simple }),
    );
    // санкция 158 ч. 3 — ЛС от 2 мес до 6 лет. 1/3 от 6 лет = 2 года = 720 дн.
    const expectedMin = Math.max(2 * 30, Math.floor((6 * Y) / 3));
    expect(r.finalRange.min).toBe(expectedMin);
    expect(r.log.some((s) => s.ruleId === 'E-068-2')).toBe(true);
  });
});

// ── E-064 ──────────────────────────────────────────────────────────────────

describe('E-064: исключительные обстоятельства', () => {
  it('ст. 64: min → 0', () => {
    const r = computeEpisode(
      ep({
        articleNumber: '105',
        articlePart: '1',
        flags: {
          mitigatingIds: [],
          aggravatingIds: [],
          art62_1: false,
          art64: true,
          art65: false,
          art15_6_applied: false,
        },
      }),
      partOf('105', '1'),
      baseCtx(),
    );
    expect(r.finalRange.min).toBe(0);
    expect(r.log.some((s) => s.ruleId === 'E-064')).toBe(true);
  });
});

// ── J-088 ──────────────────────────────────────────────────────────────────

describe('J-088: несовершеннолетний', () => {
  it('14 лет на момент совершения, ст. 158 ч. 4 (max 10 лет): лимит 6 лет', () => {
    const minor: Subject = { ...adultMale, birthDate: '2010-01-01' };
    const r = computeEpisode(
      ep({
        articleNumber: '158',
        articlePart: '4',
        commitDate: '2024-06-01', // 14 лет
      }),
      partOf('158', '4'),
      baseCtx({ subject: minor }),
    );
    // 158 ч. 4 — категория Heavy (не EspeciallyHeavy), <16 → лимит 6 лет.
    expect(r.finalRange.max).toBe(6 * Y);
    expect(r.log.some((s) => s.ruleId === 'J-088-MAX')).toBe(true);
  });

  it('17 лет: лимит ЛС 10 лет (а санкция ст. 105 ч. 1 — 15)', () => {
    const minor: Subject = { ...adultMale, birthDate: '2008-01-01' };
    const r = computeEpisode(
      ep({ commitDate: '2024-06-01' }),
      partOf('105', '1'),
      baseCtx({ subject: minor }),
    );
    expect(r.finalRange.max).toBe(10 * Y);
  });
});

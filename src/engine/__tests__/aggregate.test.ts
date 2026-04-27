/**
 * Тесты совокупности преступлений (M-069-2, M-069-3, M-069-5, M-070, M-070-25).
 */

import { describe, expect, it } from 'vitest';

import { CrimeCategory, PunishmentKind } from '@domain/enums';
import type { ArticlePart, Conviction, Episode } from '@domain/types';
import { findArticlePart } from '@legal/articles/registry';
import { SEED_ARTICLES } from '@legal/articles/seed';

import { computeAggregate } from '../aggregate';
import type { EpisodeCalc } from '../types';

const Y = 360;

const part = (num: string, p: string): ArticlePart =>
  findArticlePart(SEED_ARTICLES, num, p)!;

const ep = (id: string, num: string, p: string): Episode => ({
  id,
  commitDate: '2025-01-01',
  articleNumber: num,
  articlePart: p,
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
});

const calc = (id: string, min: number, max: number): EpisodeCalc => ({
  episodeId: id,
  punishmentKind: PunishmentKind.Imprisonment,
  baseRange: { min, max },
  finalRange: { min, max },
  log: [],
  warnings: [],
});

// ────────────────────────────────────────────────────────────────────────────

describe('Один эпизод', () => {
  it('Возвращает диапазон без изменений', () => {
    const r = computeAggregate({
      episodes: [{ episode: ep('1', '105', '1'), part: part('105', '1'), calc: calc('1', 6 * Y, 15 * Y) }],
      pendingConvictions69_5: [],
      pendingConvictions70: [],
    });
    expect(r.kind).toBe('single');
    expect(r.range.min).toBe(6 * Y);
    expect(r.range.max).toBe(15 * Y);
  });
});

// ── M-069-2 ────────────────────────────────────────────────────────────────

describe('M-069-2: совокупность небольшой/средней', () => {
  it('Два эпизода 158 ч. 1 (max 2 года): лимит 1.5 × 2 = 3 года', () => {
    const r = computeAggregate({
      episodes: [
        { episode: ep('1', '158', '1'), part: part('158', '1'), calc: calc('1', 60, 2 * Y) },
        { episode: ep('2', '158', '1'), part: part('158', '1'), calc: calc('2', 60, 2 * Y) },
      ],
      pendingConvictions69_5: [],
      pendingConvictions70: [],
    });
    expect(r.kind).toBe('art69_2');
    expect(r.range.max).toBe(Math.floor(2 * Y * 1.5));
  });
});

// ── min совокупности (регрессия по PDF Васи Пупкина) ───────────────────────

describe('min совокупности — правило частичного сложения', () => {
  it('ч. 3: min = Σ min эпизодов даже если у самого «тяжкого» min=0 (E-064)', () => {
    // 158 ч. 3 (тяжкое): min 2 мес, max 6 лет
    // 161 ч. 3 (особо тяжкое): min 6 лет, max 8 лет
    // 158 ч. 4 (тяжкое) с E-064 → min 0, max 10 лет — самый «тяжкий» по max
    const r = computeAggregate({
      episodes: [
        { episode: ep('1', '158', '3'), part: part('158', '3'), calc: calc('1', 60, 6 * Y) },
        { episode: ep('2', '161', '3'), part: part('161', '3'), calc: calc('2', 6 * Y, 8 * Y) },
        { episode: ep('3', '158', '4'), part: part('158', '4'), calc: calc('3', 0, 10 * Y) },
      ],
      pendingConvictions69_5: [],
      pendingConvictions70: [],
    });
    expect(r.kind).toBe('art69_3');
    // Σ min = 60 + 2160 + 0 = 2220 = 6 лет 2 мес
    expect(r.range.min).toBe(60 + 6 * Y + 0);
    // max = min(sum=24 лет, 1.5×10=15 лет, 25) = 15 лет
    expect(r.range.max).toBe(Math.floor(10 * Y * 1.5));
  });

  it('ч. 2: min = max(min эпизодов) (поглощение допустимо)', () => {
    // 158 ч. 1 (Small): min 60 дн, max 2 года
    // 158 ч. 1: min 60 дн, max 2 года
    const r = computeAggregate({
      episodes: [
        { episode: ep('1', '158', '1'), part: part('158', '1'), calc: calc('1', 60, 2 * Y) },
        { episode: ep('2', '158', '1'), part: part('158', '1'), calc: calc('2', 60, 2 * Y) },
      ],
      pendingConvictions69_5: [],
      pendingConvictions70: [],
    });
    expect(r.kind).toBe('art69_2');
    // max(min) = 60
    expect(r.range.min).toBe(60);
  });

  it('ч. 3 + ст. 70: финал (Σ min + неотбытое) … (max + неотбытое), регрессия PDF', () => {
    // Воспроизводим кейс «Вася Пупкин»: 3 эпизода + неотбытое 3 года.
    const conv = {
      id: 'c1',
      effectiveDate: '2022-01-01',
      composition: [],
      sentence: { kind: 'imprisonment' as const, duration: { years: 3, months: 0, days: 0 } },
      status: 'partially_served' as const,
      worstCategory: CrimeCategory.Heavy,
      unservedPart: { years: 3, months: 0, days: 0 },
    };
    const r = computeAggregate({
      episodes: [
        { episode: ep('1', '158', '3'), part: part('158', '3'), calc: calc('1', 60, 6 * Y) },
        { episode: ep('2', '161', '3'), part: part('161', '3'), calc: calc('2', 6 * Y, 8 * Y) },
        { episode: ep('3', '158', '4'), part: part('158', '4'), calc: calc('3', 0, 10 * Y) },
      ],
      pendingConvictions69_5: [],
      pendingConvictions70: [conv],
    });
    expect(r.kind).toBe('art70');
    // min до ст. 70 = 60+2160+0=2220, плюс 3 года 1080 = 3300 = 9 лет 60 дн
    expect(r.range.min).toBe(60 + 6 * Y + 3 * Y);
    // max до ст. 70 = 15 лет, плюс 3 года = 18 лет
    expect(r.range.max).toBe(15 * Y + 3 * Y);
  });
});

// ── M-069-3 ────────────────────────────────────────────────────────────────

describe('M-069-3: совокупность с тяжким', () => {
  it('158 ч. 3 (тяжкое, max 6 лет) + 158 ч. 1 (max 2 года): только сложение, лимит 1.5×6 = 9', () => {
    const r = computeAggregate({
      episodes: [
        { episode: ep('1', '158', '3'), part: part('158', '3'), calc: calc('1', 60, 6 * Y) },
        { episode: ep('2', '158', '1'), part: part('158', '1'), calc: calc('2', 60, 2 * Y) },
      ],
      pendingConvictions69_5: [],
      pendingConvictions70: [],
    });
    expect(r.kind).toBe('art69_3');
    // sum = 8 лет; ceiling = 9 лет; min(8,9) = 8 лет
    expect(r.range.max).toBe(8 * Y);
  });

  it('Лимит 25 лет ЛС', () => {
    const r = computeAggregate({
      episodes: [
        { episode: ep('1', '105', '1'), part: part('105', '1'), calc: calc('1', 6 * Y, 15 * Y) },
        { episode: ep('2', '105', '1'), part: part('105', '1'), calc: calc('2', 6 * Y, 15 * Y) },
        { episode: ep('3', '105', '1'), part: part('105', '1'), calc: calc('3', 6 * Y, 15 * Y) },
      ],
      pendingConvictions69_5: [],
      pendingConvictions70: [],
    });
    // sum = 45, ceiling = 22.5 (1.5×15), final = min(45, 22.5, 25*Y) = 22.5
    expect(r.range.max).toBe(Math.floor(15 * Y * 1.5));
    expect(r.range.max).toBeLessThanOrEqual(25 * Y);
  });
});

// ── M-069-5 ────────────────────────────────────────────────────────────────

describe('M-069-5: эпизод до приговора', () => {
  it('Из расчёта вычитается фактически отбытое', () => {
    const conviction: Conviction = {
      id: 'c1',
      effectiveDate: '2024-01-01',
      composition: [],
      sentence: { kind: 'imprisonment', duration: { years: 5, months: 0, days: 0 } },
      status: 'served',
      actuallyServed: { years: 2, months: 0, days: 0 },
      worstCategory: CrimeCategory.Heavy,
    };
    const r = computeAggregate({
      episodes: [
        {
          episode: ep('1', '158', '3'),
          part: part('158', '3'),
          calc: calc('1', 60, 6 * Y),
        },
      ],
      pendingConvictions69_5: [conviction],
      pendingConvictions70: [],
    });
    expect(r.kind).toBe('art69_5');
    expect(r.range.max).toBe(6 * Y - 2 * Y);
  });
});

// ── M-070 ──────────────────────────────────────────────────────────────────

describe('M-070: совокупность приговоров', () => {
  it('К новому диапазону прибавляется неотбытая часть', () => {
    const conviction: Conviction = {
      id: 'c1',
      effectiveDate: '2023-01-01',
      composition: [],
      sentence: { kind: 'imprisonment', duration: { years: 5, months: 0, days: 0 } },
      status: 'partially_served',
      actuallyServed: { years: 2, months: 0, days: 0 },
      worstCategory: CrimeCategory.Heavy,
    };
    const r = computeAggregate({
      episodes: [
        { episode: ep('1', '158', '3'), part: part('158', '3'), calc: calc('1', 60, 6 * Y) },
      ],
      pendingConvictions69_5: [],
      pendingConvictions70: [conviction],
    });
    expect(r.kind).toBe('art70');
    // 6 лет + неотбытая (5−2 = 3) = 9 лет
    expect(r.range.max).toBe(9 * Y);
  });

  it('Лимит 30 лет', () => {
    const conviction: Conviction = {
      id: 'c1',
      effectiveDate: '2023-01-01',
      composition: [],
      sentence: { kind: 'imprisonment', duration: { years: 28, months: 0, days: 0 } },
      status: 'partially_served',
      worstCategory: CrimeCategory.EspeciallyHeavy,
    };
    const r = computeAggregate({
      episodes: [
        { episode: ep('1', '105', '1'), part: part('105', '1'), calc: calc('1', 6 * Y, 15 * Y) },
      ],
      pendingConvictions69_5: [],
      pendingConvictions70: [conviction],
    });
    expect(r.range.max).toBe(30 * Y);
  });
});

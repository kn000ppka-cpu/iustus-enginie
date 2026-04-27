/**
 * Тест-санитарии seed-каталога:
 *   1. Уникальность пар (article.number, part.part).
 *   2. У всех частей есть хотя бы один основной (не доп.) вид наказания.
 *   3. min ≤ max в каждом SanctionOption (для не-«символических» видов).
 *   4. Категория, заданная вручную, не противоречит `deriveCategory(part)` —
 *      допускается совпадение либо с 'intentional', либо с 'negligent'
 *      (форма вины не хранится в части — выбирается ту, которая совпала).
 *   5. Поиск по реестру и сортировка номеров работают корректно.
 */

import { describe, expect, it } from 'vitest';

import { PunishmentKind } from '@domain/enums';
import { SEED_ARTICLES } from '../seed';
import { deriveCategory } from '../category';
import {
  buildArticleIndex,
  compareArticleNumbers,
  findArticlePart,
  searchArticles,
} from '../registry';

const SYMBOLIC: PunishmentKind[] = [
  PunishmentKind.LifeImprisonment,
  PunishmentKind.DeathPenalty,
  PunishmentKind.DeprivationOfTitle,
];

describe('SEED_ARTICLES', () => {
  it('все пары (статья, часть) уникальны', () => {
    const seen = new Set<string>();
    for (const a of SEED_ARTICLES) {
      for (const p of a.parts) {
        const key = `${a.number}/${p.part}`;
        expect(seen.has(key), `дубликат ${key}`).toBe(false);
        seen.add(key);
      }
    }
  });

  it('у каждой части есть хотя бы один основной вид наказания', () => {
    for (const a of SEED_ARTICLES) {
      for (const p of a.parts) {
        const main = p.sanctions.filter((s) => !s.isAdditional);
        expect(main.length, `${a.number} ч. ${p.part}`).toBeGreaterThan(0);
      }
    }
  });

  it('min ≤ max в каждом SanctionOption', () => {
    for (const a of SEED_ARTICLES) {
      for (const p of a.parts) {
        for (const s of p.sanctions) {
          if (SYMBOLIC.includes(s.kind)) continue;
          expect(
            s.min <= s.max,
            `${a.number} ч. ${p.part} (${s.kind}): min=${s.min} max=${s.max}`,
          ).toBe(true);
        }
      }
    }
  });

  it('категория совпадает с deriveCategory хотя бы для одной формы вины', () => {
    for (const a of SEED_ARTICLES) {
      for (const p of a.parts) {
        const intentional = deriveCategory(p, 'intentional');
        const negligent = deriveCategory(p, 'negligent');
        const ok = p.category === intentional || p.category === negligent;
        expect(
          ok,
          `${a.number} ч. ${p.part}: задана ${p.category}, ` +
            `derive(intentional)=${intentional}, derive(negligent)=${negligent}`,
        ).toBe(true);
      }
    }
  });
});

describe('registry', () => {
  it('compareArticleNumbers: 228 < 228.1 < 229', () => {
    expect(compareArticleNumbers('228', '228.1')).toBeLessThan(0);
    expect(compareArticleNumbers('228.1', '229')).toBeLessThan(0);
    expect(compareArticleNumbers('111', '228')).toBeLessThan(0);
  });

  it('buildArticleIndex отдаёт seed по умолчанию, отсортирован', () => {
    const idx = buildArticleIndex();
    expect(idx.length).toBe(SEED_ARTICLES.length);
    for (let i = 1; i < idx.length; i++) {
      expect(compareArticleNumbers(idx[i - 1]!.number, idx[i]!.number)).toBeLessThanOrEqual(0);
    }
  });

  it('findArticlePart находит конкретную часть', () => {
    const idx = buildArticleIndex();
    expect(findArticlePart(idx, '105', '1')?.disposition).toMatch(/Убийство/);
    expect(findArticlePart(idx, '228.1', '5')?.sanctions.some((s) => s.kind === 'life_imprisonment'))
      .toBe(true);
    expect(findArticlePart(idx, '999', '1')).toBeUndefined();
  });

  it('searchArticles ищет по номеру и названию', () => {
    const idx = buildArticleIndex();
    expect(searchArticles(idx, '228').map((a) => a.number)).toEqual(['228', '228.1']);
    expect(searchArticles(idx, 'кражa').length).toBe(0); // латинская «a»
    expect(searchArticles(idx, 'грабёж').map((a) => a.number)).toEqual(['161']);
  });

  it('пользовательская статья не подменяет seed с тем же номером', () => {
    const fakeUserArticle = { ...SEED_ARTICLES[0]!, source: 'user' as const, title: 'FAKE' };
    const idx = buildArticleIndex([fakeUserArticle]);
    const a105 = idx.find((a) => a.number === '105');
    expect(a105?.title).toBe('Убийство');
    expect(a105?.source).toBe('core');
  });

  it('пользовательская статья с новым номером добавляется', () => {
    const userArticle = {
      number: '999',
      title: 'Тестовая',
      source: 'user' as const,
      parts: [
        {
          part: '1',
          disposition: 'Тест',
          category: 'small' as const,
          sanctions: [{ kind: PunishmentKind.Fine, min: 0, max: 100_000 }],
        },
      ],
    };
    const idx = buildArticleIndex([userArticle]);
    expect(idx.find((a) => a.number === '999')).toBeDefined();
  });
});

/**
 * Тесты автозаполнения worstCategory из composition[].
 */

import { describe, expect, it } from 'vitest';

import { CrimeCategory, ConvictionStatus } from '@domain/enums';
import type { Conviction } from '@domain/types';
import { SEED_ARTICLES } from '@legal/articles/seed';

import { autoWorstCategory, enrichConvictions } from '../conviction-enrich';

const baseConv = (
  over: Partial<Conviction> & Pick<Conviction, 'id'>,
): Conviction => ({
  effectiveDate: '2020-01-01',
  composition: [],
  sentence: { kind: 'imprisonment', duration: { years: 1, months: 0, days: 0 } },
  status: ConvictionStatus.Served,
  ...over,
});

describe('autoWorstCategory', () => {
  it('одна статья → её категория', () => {
    expect(
      autoWorstCategory([{ article: '158', part: '3' }], SEED_ARTICLES),
    ).toBe(CrimeCategory.Heavy);
  });

  it('совокупность → берётся самая тяжкая', () => {
    // 158 ч. 1 (Small) + 158 ч. 3 (Heavy) + 105 ч. 1 (EspeciallyHeavy)
    const r = autoWorstCategory(
      [
        { article: '158', part: '1' },
        { article: '158', part: '3' },
        { article: '105', part: '1' },
      ],
      SEED_ARTICLES,
    );
    expect(r).toBe(CrimeCategory.EspeciallyHeavy);
  });

  it('пустой массив → undefined', () => {
    expect(autoWorstCategory([], SEED_ARTICLES)).toBeUndefined();
  });

  it('несуществующая статья игнорируется', () => {
    expect(
      autoWorstCategory(
        [
          { article: '999', part: '1' },
          { article: '158', part: '3' },
        ],
        SEED_ARTICLES,
      ),
    ).toBe(CrimeCategory.Heavy);
  });
});

describe('enrichConvictions', () => {
  it('worstCategory не задан → авто-вычисляется из composition', () => {
    const c = baseConv({
      id: 'c1',
      composition: [
        { article: '158', part: '3' },
        { article: '105', part: '1' },
      ],
    });
    const [enriched] = enrichConvictions([c], SEED_ARTICLES);
    expect(enriched?.worstCategory).toBe(CrimeCategory.EspeciallyHeavy);
  });

  it('worstCategory задан вручную → не перезаписывается (override)', () => {
    const c = baseConv({
      id: 'c1',
      worstCategory: CrimeCategory.Small,
      composition: [{ article: '105', part: '1' }], // ОТЯ
    });
    const [enriched] = enrichConvictions([c], SEED_ARTICLES);
    expect(enriched?.worstCategory).toBe(CrimeCategory.Small);
  });

  it('пустой composition + не задан → остаётся undefined', () => {
    const c = baseConv({ id: 'c1', composition: [] });
    const [enriched] = enrichConvictions([c], SEED_ARTICLES);
    expect(enriched?.worstCategory).toBeUndefined();
  });
});

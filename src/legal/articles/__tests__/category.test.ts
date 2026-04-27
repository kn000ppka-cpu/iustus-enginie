import { describe, expect, it } from 'vitest';

import { CrimeCategory, PunishmentKind } from '@domain/enums';
import type { ArticlePart } from '@domain/types';
import { Y, imprY, imprUpToY, lifeImpr } from '../helpers';
import { deriveCategory, hasLifeOrDeath, maxImprisonmentDays } from '../category';

const part = (sanctions: ArticlePart['sanctions']): ArticlePart => ({
  part: '1',
  disposition: '',
  category: CrimeCategory.Small,
  sanctions,
});

describe('maxImprisonmentDays', () => {
  it('возвращает максимум ЛС в днях', () => {
    expect(maxImprisonmentDays(part([imprY(2, 5)]))).toBe(5 * Y);
  });
  it('возвращает null если ЛС нет', () => {
    expect(maxImprisonmentDays(part([{ kind: PunishmentKind.Fine, min: 0, max: 100_000 }])))
      .toBeNull();
  });
  it('игнорирует дополнительные виды', () => {
    expect(
      maxImprisonmentDays(
        part([
          imprY(2, 5),
          {
            kind: PunishmentKind.Imprisonment,
            min: 0,
            max: 100 * Y,
            isAdditional: true,
          },
        ]),
      ),
    ).toBe(5 * Y);
  });
});

describe('hasLifeOrDeath', () => {
  it('true для санкции с ПЛС', () => {
    expect(hasLifeOrDeath(part([imprY(8, 20), lifeImpr()]))).toBe(true);
  });
  it('false иначе', () => {
    expect(hasLifeOrDeath(part([imprY(2, 5)]))).toBe(false);
  });
});

describe('deriveCategory — умышленные', () => {
  it('≤ 3 года → небольшой тяжести', () => {
    expect(deriveCategory(part([imprUpToY(3)]), 'intentional')).toBe(CrimeCategory.Small);
  });
  it('5 лет → средней', () => {
    expect(deriveCategory(part([imprUpToY(5)]), 'intentional')).toBe(CrimeCategory.Medium);
  });
  it('10 лет → тяжкое', () => {
    expect(deriveCategory(part([imprUpToY(10)]), 'intentional')).toBe(CrimeCategory.Heavy);
  });
  it('15 лет → особо тяжкое', () => {
    expect(deriveCategory(part([imprY(6, 15)]), 'intentional')).toBe(
      CrimeCategory.EspeciallyHeavy,
    );
  });
  it('ПЛС → особо тяжкое', () => {
    expect(deriveCategory(part([lifeImpr()]), 'intentional')).toBe(
      CrimeCategory.EspeciallyHeavy,
    );
  });
});

describe('deriveCategory — неосторожные', () => {
  it('≤ 3 года → небольшой', () => {
    expect(deriveCategory(part([imprUpToY(3)]), 'negligent')).toBe(CrimeCategory.Small);
  });
  it('10 лет → средней (не тяжкое, как у умышленных)', () => {
    expect(deriveCategory(part([imprUpToY(10)]), 'negligent')).toBe(CrimeCategory.Medium);
  });
  it('15 лет → тяжкое', () => {
    expect(deriveCategory(part([imprUpToY(15)]), 'negligent')).toBe(CrimeCategory.Heavy);
  });
  it('20 лет → особо тяжкое', () => {
    expect(deriveCategory(part([imprY(5, 20)]), 'negligent')).toBe(
      CrimeCategory.EspeciallyHeavy,
    );
  });
});

describe('deriveCategory — без ЛС', () => {
  it('санкция только со штрафом → небольшой', () => {
    expect(
      deriveCategory(
        part([{ kind: PunishmentKind.Fine, min: 0, max: 100_000 }]),
        'intentional',
      ),
    ).toBe(CrimeCategory.Small);
  });
});

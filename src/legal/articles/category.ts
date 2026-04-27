/**
 * Производная категории преступления из санкции (УК ст. 15).
 *
 * Логика:
 *   1. Берём максимум ЛС в санкции части статьи.
 *   2. Если ЛС нет — категория «небольшой тяжести» (макс. наказание не превышает
 *      3 лет ЛС в принципе).
 *   3. Если есть ПЛС или смертная казнь — особо тяжкое.
 *   4. Иначе по таблице ст. 15 чч. 2–5 с разницей для умышленных и
 *      неосторожных:
 *        • небольшой:        ≤ 3 года (любая форма вины);
 *        • средней:          умышл. > 3 ≤ 5 лет; неост. > 3 лет;
 *        • тяжкое:           умышл. > 5 ≤ 10 лет; неост. > 10 ≤ 15 лет;
 *        • особо тяжкое:     умышл. > 10 лет; неост. > 15 лет.
 *
 * Используется для:
 *   • валидации seed-каталога (категория, заданная вручную, должна совпадать с
 *     результатом этой функции);
 *   • автозаполнения категории при добавлении пользовательской статьи;
 *   • контрольных предупреждений UI.
 */

import { CrimeCategory, PunishmentKind } from '@domain/enums';
import type { ArticlePart, SanctionOption } from '@domain/types';
import { Y } from './helpers';

export type CrimeForm = 'intentional' | 'negligent';

/** Возвращает максимум ЛС (в днях) из основной санкции, либо null если ЛС нет. */
export function maxImprisonmentDays(part: ArticlePart): number | null {
  const main = part.sanctions.filter((s) => !s.isAdditional);
  let max: number | null = null;
  for (const s of main) {
    if (s.kind === PunishmentKind.Imprisonment) {
      max = max === null ? s.max : Math.max(max, s.max);
    }
  }
  return max;
}

/** Есть ли ПЛС / смертная в основной санкции. */
export function hasLifeOrDeath(part: ArticlePart): boolean {
  return part.sanctions.some(
    (s: SanctionOption) =>
      !s.isAdditional &&
      (s.kind === PunishmentKind.LifeImprisonment ||
        s.kind === PunishmentKind.DeathPenalty),
  );
}

/** Категория преступления — расчёт по ст. 15 УК. */
export function deriveCategory(
  part: ArticlePart,
  form: CrimeForm = 'intentional',
): CrimeCategory {
  if (hasLifeOrDeath(part)) return CrimeCategory.EspeciallyHeavy;

  const maxImpr = maxImprisonmentDays(part);
  if (maxImpr === null) return CrimeCategory.Small;

  const years = maxImpr / Y;

  if (years <= 3) return CrimeCategory.Small;

  if (form === 'intentional') {
    if (years <= 5) return CrimeCategory.Medium;
    if (years <= 10) return CrimeCategory.Heavy;
    return CrimeCategory.EspeciallyHeavy;
  } else {
    // неосторожные
    if (years <= 10) return CrimeCategory.Medium;
    if (years <= 15) return CrimeCategory.Heavy;
    return CrimeCategory.EspeciallyHeavy;
  }
}

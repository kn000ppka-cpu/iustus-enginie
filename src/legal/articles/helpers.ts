/**
 * Конструкторы санкций для seed-каталога статей УК.
 *
 * Цель — превращать декларативный текст санкции из УК
 *   («лишением свободы на срок от шести до пятнадцати лет»)
 * в `SanctionOption` с величинами в естественных единицах (см.
 * `PUNISHMENT_UNIT`):
 *   • срок — в днях (1 год = 360 дней, 1 месяц = 30 дней — соответствует
 *     эквивалентам УК ст. 71/72);
 *   • штраф — в рублях;
 *   • обязательные работы — в часах.
 *
 * Все хелперы возвращают полностью построенный `SanctionOption`, чтобы код
 * `seed.ts` читался как сама норма УК.
 */

import { PunishmentKind } from '@domain/enums';
import type { SanctionOption } from '@domain/types';

/** 1 год = 360 дней, 1 месяц = 30 дней (УК ст. 72 ч. 1). */
export const Y = 360;
export const M = 30;

// ────────────────────────────────────────────────────────────────────────────
// Лишение свободы (ст. 56)
// ────────────────────────────────────────────────────────────────────────────

export const imprY = (minYears: number, maxYears: number): SanctionOption => ({
  kind: PunishmentKind.Imprisonment,
  min: minYears * Y,
  max: maxYears * Y,
});

/** Когда санкция указывает «до N лет» — нижний предел = минимуму ст. 56 ч. 2 (2 месяца). */
export const imprUpToY = (maxYears: number): SanctionOption => ({
  kind: PunishmentKind.Imprisonment,
  min: 2 * M,
  max: maxYears * Y,
});

export const imprUpToM = (maxMonths: number): SanctionOption => ({
  kind: PunishmentKind.Imprisonment,
  min: 2 * M,
  max: maxMonths * M,
});

// ────────────────────────────────────────────────────────────────────────────
// Пожизненное и смертная (ст. 57, 59) — без min/max в обычном смысле
// ────────────────────────────────────────────────────────────────────────────

export const lifeImpr = (): SanctionOption => ({
  kind: PunishmentKind.LifeImprisonment,
  min: 0,
  max: 0,
});

export const death = (): SanctionOption => ({
  kind: PunishmentKind.DeathPenalty,
  min: 0,
  max: 0,
});

// ────────────────────────────────────────────────────────────────────────────
// Принудительные / исправительные / обязательные работы; ограничение свободы
// ────────────────────────────────────────────────────────────────────────────

export const forcedY = (minYears: number, maxYears: number): SanctionOption => ({
  kind: PunishmentKind.ForcedWork,
  min: minYears * Y,
  max: maxYears * Y,
});

export const forcedUpToY = (maxYears: number): SanctionOption => ({
  kind: PunishmentKind.ForcedWork,
  min: 2 * M, // ст. 53.1 ч. 4 — от 2 месяцев
  max: maxYears * Y,
});

export const correctUpToY = (maxYears: number): SanctionOption => ({
  kind: PunishmentKind.CorrectionalWork,
  min: 2 * M, // ст. 50 ч. 1 — от 2 месяцев
  max: maxYears * Y,
});

export const correctUpToM = (maxMonths: number): SanctionOption => ({
  kind: PunishmentKind.CorrectionalWork,
  min: 2 * M,
  max: maxMonths * M,
});

export const mandatoryHours = (minHours: number, maxHours: number): SanctionOption => ({
  kind: PunishmentKind.MandatoryWork,
  min: minHours,
  max: maxHours,
});

export const mandatoryUpToH = (maxHours: number): SanctionOption => ({
  kind: PunishmentKind.MandatoryWork,
  min: 60, // ст. 49 ч. 2 — от 60 часов
  max: maxHours,
});

export const restrictUpToY = (maxYears: number): SanctionOption => ({
  kind: PunishmentKind.RestrictionOfFreedom,
  min: 2 * M,
  max: maxYears * Y,
});

export const restrictY = (minYears: number, maxYears: number): SanctionOption => ({
  kind: PunishmentKind.RestrictionOfFreedom,
  min: minYears * Y,
  max: maxYears * Y,
});

// ────────────────────────────────────────────────────────────────────────────
// Арест (ст. 54)
// ────────────────────────────────────────────────────────────────────────────

export const arrestUpToM = (maxMonths: number): SanctionOption => ({
  kind: PunishmentKind.Arrest,
  min: M, // ст. 54 ч. 1 — от 1 месяца
  max: maxMonths * M,
});

// ────────────────────────────────────────────────────────────────────────────
// Штраф (ст. 46)
// ────────────────────────────────────────────────────────────────────────────

export const fineRub = (minRub: number, maxRub: number): SanctionOption => ({
  kind: PunishmentKind.Fine,
  min: minRub,
  max: maxRub,
});

export const fineUpToRub = (maxRub: number): SanctionOption => ({
  kind: PunishmentKind.Fine,
  min: 5_000, // ст. 46 ч. 2 — от 5 000 руб.
  max: maxRub,
});

// ────────────────────────────────────────────────────────────────────────────
// Дополнительные виды (ст. 47, 48)
// ────────────────────────────────────────────────────────────────────────────

/** Лишение права занимать должности — как ДОПОЛНИТЕЛЬНОЕ. */
export const deprRightAddY = (
  maxYears: number,
  mandatory = false,
): SanctionOption => ({
  kind: PunishmentKind.DeprivationOfRight,
  min: 6 * M, // ст. 47 ч. 2 — от 6 месяцев (для дополнительного)
  max: maxYears * Y,
  isAdditional: true,
  isAdditionalMandatory: mandatory,
});

export const deprTitleAdd = (): SanctionOption => ({
  kind: PunishmentKind.DeprivationOfTitle,
  min: 0,
  max: 0,
  isAdditional: true,
});

/** Штраф как дополнительный вид (например, 290 ч. 5–6). */
export const fineAddRub = (minRub: number, maxRub: number): SanctionOption => ({
  kind: PunishmentKind.Fine,
  min: minRub,
  max: maxRub,
  isAdditional: true,
  isAdditionalMandatory: true,
});

/** Ограничение свободы как дополнительное. */
export const restrictAddY = (maxYears: number): SanctionOption => ({
  kind: PunishmentKind.RestrictionOfFreedom,
  min: 6 * M, // ст. 53 ч. 2 — от 6 мес. (дополнительное)
  max: maxYears * Y,
  isAdditional: true,
});

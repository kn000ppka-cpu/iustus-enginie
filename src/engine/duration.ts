/**
 * Утилиты конвертации Дней ↔ Duration {years, months, days}.
 *
 * Базис: 1 год = 360 дней, 1 месяц = 30 дней (УК ст. 71, 72).
 * Без округления — остаток в днях сохраняется как `days`.
 */

import type { Duration } from '@domain/types';

const Y = 360;
const M = 30;

export function daysToDuration(totalDays: number): Duration {
  const safe = Math.max(0, Math.floor(totalDays));
  const years = Math.floor(safe / Y);
  const remAfterYears = safe - years * Y;
  const months = Math.floor(remAfterYears / M);
  const days = remAfterYears - months * M;
  return { years, months, days };
}

export function durationToDays(d: Duration): number {
  return d.years * Y + d.months * M + d.days;
}

/** Форматирование Duration: «5 лет 6 мес. 0 дн.» / «8 мес. 15 дн.» */
export function formatDuration(d: Duration): string {
  const parts: string[] = [];
  if (d.years > 0) parts.push(`${d.years} ${pluralYears(d.years)}`);
  if (d.months > 0) parts.push(`${d.months} мес.`);
  if (d.days > 0) parts.push(`${d.days} дн.`);
  if (parts.length === 0) return '0 дн.';
  return parts.join(' ');
}

export function formatDays(totalDays: number): string {
  return formatDuration(daysToDuration(totalDays));
}

function pluralYears(n: number): string {
  const abs = Math.abs(n);
  const last = abs % 10;
  const last2 = abs % 100;
  if (last2 >= 11 && last2 <= 14) return 'лет';
  if (last === 1) return 'год';
  if (last >= 2 && last <= 4) return 'года';
  return 'лет';
}

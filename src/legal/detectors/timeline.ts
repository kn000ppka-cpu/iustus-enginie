/**
 * Детекторы Timeline (Этап 2).
 *
 * Чистая логика — не зависит от React, не читает store. Вход:
 *   • subject (для возрастных исключений ст. 18 ч. 4)
 *   • список эпизодов (Episode[])
 *   • список приговоров (Conviction[])
 *   • дата вынесения текущего приговора (referenceDate, ISO YYYY-MM-DD)
 *
 * Реализованы правила из legal-catalogue.md:
 *   T-018       — вид рецидива
 *   T-018-EXCL  — исключения из рецидива
 *   T-069-5     — детектор «преступление до приговора» (ст. 69 ч. 5)
 *   T-070       — детектор «совокупность приговоров» (ст. 70)
 *   T-086       — погашение судимости
 *
 * Глобальные принципы (по решениям пользователя):
 *   • датой приговора считается дата вступления в силу (effectiveDate);
 *   • период УДО НЕ засчитывается как отбытие (учитывается через
 *     `actuallyServed`, который не включает период УДО);
 *   • при отсутствии servingStartDate и actuallyServed — судимость
 *     считается «непогашённой» (нет данных для расчёта погашения).
 */

import { addDays, addYears, parseISO } from 'date-fns';

import {
  ConvictionStatus,
  CrimeCategory,
  RecidivismKind,
} from '@domain/enums';
import type {
  Conviction,
  Duration as TermDuration,
  Episode,
  IsoDate,
  Subject,
} from '@domain/types';
import { ageAt } from '@legal/filters/subject-filters';
import type { RuleId } from '@legal/rules/catalogue';

// ────────────────────────────────────────────────────────────────────────────
// Утилиты дат
// ────────────────────────────────────────────────────────────────────────────

const Y_DAYS = 360;
const M_DAYS = 30;

/** Сумма Duration в днях (1 г = 360, 1 м = 30 — как в УК ст. 71/72). */
export function durationDays(d: TermDuration): number {
  return d.years * Y_DAYS + d.months * M_DAYS + d.days;
}

/** Прибавить Duration к дате; возвращает ISO. */
export function addDuration(iso: IsoDate, d: TermDuration): IsoDate {
  const date = parseISO(iso);
  const withYears = addYears(date, d.years);
  // месяцы и дни — через days, чтобы соблюсти 30 дней = 1 месяц.
  const withMonthsAsDays = addDays(withYears, d.months * 30 + d.days);
  return toIso(withMonthsAsDays);
}

function toIso(d: Date): IsoDate {
  return d.toISOString().slice(0, 10);
}

/** Сравнение ISO-дат: -1 / 0 / 1. */
export function compareIso(a: IsoDate, b: IsoDate): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

// ────────────────────────────────────────────────────────────────────────────
// T-086. Погашение судимости (ст. 86 УК)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Сроки погашения судимости — ст. 86 ч. 3 УК.
 * NB: при УО судимость погашается по истечении испытательного срока
 * (ст. 86 ч. 3 п. «а»). Здесь возвращается срок «после отбытия» —
 * специфика УО обрабатывается отдельно.
 */
const EXPUNGE_YEARS_BY_CATEGORY: Record<CrimeCategory, number> = {
  small: 3,
  medium: 3,
  heavy: 8,
  especially_heavy: 10,
};

/**
 * Дата погашения судимости (если её можно вычислить).
 * Возвращает null если:
 *   • нет данных об отбытии (`servingStartDate` или `actuallyServed`);
 *   • уже снята/погашена/амнистия — флаг `status`.
 *
 * Иначе:
 *   expunge = servingStartDate + actuallyServed + N лет,
 *   где N зависит от категории составов в приговоре.
 */
export function expungeDate(c: Conviction): IsoDate | null {
  if (
    c.status === ConvictionStatus.Expunged ||
    c.status === ConvictionStatus.Amnesty ||
    c.status === ConvictionStatus.Pardoned
  ) {
    return null; // уже не учитывается
  }

  // Отдельный кейс — условное осуждение (УО).
  // Срок погашения = effectiveDate + испытательный срок. В нашей модели
  // испыт. срок не хранится отдельно, считаем как длительность
  // назначенного `sentence.duration` (упрощение для v1).
  if (c.status === ConvictionStatus.Conditional) {
    return addDuration(c.effectiveDate, c.sentence.duration);
  }

  if (!c.servingStartDate || !c.actuallyServed) return null;

  const category = c.worstCategory ?? CrimeCategory.Medium;
  const yearsAfter = EXPUNGE_YEARS_BY_CATEGORY[category];

  // дата освобождения = начало отбытия + фактически отбытое
  const released = addDuration(c.servingStartDate, c.actuallyServed);
  return addDuration(released, { years: yearsAfter, months: 0, days: 0 });
}

/** Судимость считается непогашённой на дату `at`. */
export function isUnexpunged(c: Conviction, at: IsoDate): boolean {
  if (
    c.status === ConvictionStatus.Expunged ||
    c.status === ConvictionStatus.Amnesty ||
    c.status === ConvictionStatus.Pardoned
  ) {
    return false;
  }
  const exp = expungeDate(c);
  if (exp === null) return true; // нет данных → консервативно: непогашена
  return compareIso(at, exp) < 0;
}

/** Все непогашённые на `at` судимости. */
export function activeConvictionsAt(
  convictions: Conviction[],
  at: IsoDate,
): Conviction[] {
  return convictions.filter((c) => isUnexpunged(c, at));
}

// ────────────────────────────────────────────────────────────────────────────
// T-018 / T-018-EXCL. Вид рецидива (ст. 18 УК)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Применяется ли судимость для целей рецидива (ст. 18 ч. 4):
 *   • НЕ учитываются:
 *     – судимости за умышленные преступления небольшой тяжести;
 *     – судимости, полученные до 18 лет;
 *     – УО без отмены и УДО до отмены;
 *     – погашённые / снятые;
 *     – неосторожные.
 */
export function countsForRecidivism(c: Conviction, subject: Subject): boolean {
  if (
    c.status === ConvictionStatus.Conditional ||
    c.status === ConvictionStatus.Parole ||
    c.status === ConvictionStatus.Expunged ||
    c.status === ConvictionStatus.Amnesty ||
    c.status === ConvictionStatus.Pardoned
  ) {
    return false;
  }

  const category = c.worstCategory ?? CrimeCategory.Medium;
  if (category === CrimeCategory.Small) {
    // умышленные небольшой тяжести — не учитываются (ст. 18 ч. 4 «а»)
    return false;
  }

  // судимость, полученная в несовершеннолетнем возрасте, не учитывается
  // ст. 18 ч. 4 «б»: «возраст менее 18 лет на момент совершения преступления».
  // У нас нет даты совершения старого преступления; используем дату вступления
  // приговора как консервативный прокси (даёт false positives, но безопасно).
  const ageAtConviction = ageAt(subject.birthDate, c.effectiveDate);
  if (ageAtConviction < 18) return false;

  return true;
}

/** Вид рецидива по таблице ст. 18 чч. 1–3. */
export function recidivismKindFor(
  subject: Subject,
  newEpisodeCategory: CrimeCategory,
  activeConvictions: Conviction[],
): RecidivismKind {
  const relevant = activeConvictions.filter((c) => countsForRecidivism(c, subject));
  if (relevant.length === 0) return RecidivismKind.None;

  // Если новое — небольшой тяжести (например, по ст. 15 ч. 6 категория сменилась
  // на small) — ст. 18 не образует рецидива (ч. 4 «а» по самой формулировке).
  if (newEpisodeCategory === CrimeCategory.Small) return RecidivismKind.None;

  const heavyCount = relevant.filter(
    (c) => c.worstCategory === CrimeCategory.Heavy,
  ).length;
  const especiallyHeavyCount = relevant.filter(
    (c) => c.worstCategory === CrimeCategory.EspeciallyHeavy,
  ).length;

  // ── ОСОБО ОПАСНЫЙ ────────────────────────────────────────────────────────
  // ч. 3 п. «а»: новое тяжкое + 2 раза реально отбывал ЛС за тяжкое;
  // ч. 3 п. «б»: новое особо тяжкое + ранее за тяжкое (с реальным ЛС) или
  //              за особо тяжкое.
  if (newEpisodeCategory === CrimeCategory.EspeciallyHeavy) {
    if (especiallyHeavyCount >= 1 || heavyCount >= 1) {
      return RecidivismKind.EspeciallyDangerous;
    }
  }
  if (newEpisodeCategory === CrimeCategory.Heavy && heavyCount >= 2) {
    return RecidivismKind.EspeciallyDangerous;
  }

  // ── ОПАСНЫЙ ──────────────────────────────────────────────────────────────
  // ч. 2 п. «а»: новое тяжкое + ранее ≥2 умышленных средней тяжести (ЛС) или
  //              ранее тяжкое/особо тяжкое;
  // ч. 2 п. «б»: новое особо тяжкое + ранее тяжкое.
  if (newEpisodeCategory === CrimeCategory.Heavy) {
    if (especiallyHeavyCount >= 1 || heavyCount >= 1) return RecidivismKind.Dangerous;
    const mediumCount = relevant.filter(
      (c) => c.worstCategory === CrimeCategory.Medium,
    ).length;
    if (mediumCount >= 2) return RecidivismKind.Dangerous;
  }
  if (newEpisodeCategory === CrimeCategory.EspeciallyHeavy && heavyCount >= 1) {
    return RecidivismKind.Dangerous;
  }

  // ── ПРОСТОЙ ──────────────────────────────────────────────────────────────
  return RecidivismKind.Simple;
}

// ────────────────────────────────────────────────────────────────────────────
// T-069-5 / T-070. Конфликты «эпизод vs приговор»
// ────────────────────────────────────────────────────────────────────────────

export interface TimelineConflict {
  ruleId: RuleId;
  episodeId: string;
  convictionId: string;
  /** Краткое пояснение для UI. */
  message: string;
}

/**
 * T-069-5: новый эпизод совершён ДО даты вступления приговора в силу.
 * Тогда совокупность считается по ст. 69 ч. 5: рассчитываем по чч. 2/3,
 * вычитаем фактически отбытое по старому.
 */
export function detectArt69_5Conflict(
  episode: Episode,
  conviction: Conviction,
): TimelineConflict | null {
  if (compareIso(episode.commitDate, conviction.effectiveDate) >= 0) return null;
  return {
    ruleId: 'T-069-5',
    episodeId: episode.id,
    convictionId: conviction.id,
    message:
      `Эпизод ${episode.articleNumber} ч. ${episode.articlePart} (${episode.commitDate}) ` +
      `совершён до вступления в силу приговора от ${conviction.effectiveDate}. ` +
      `Совокупность — по ст. 69 ч. 5 УК.`,
  };
}

/**
 * T-070: новый эпизод совершён ПОСЛЕ вступления старого приговора в силу,
 * срок не отбыт полностью или есть отмена УО / УДО.
 */
export function detectArt70Conflict(
  episode: Episode,
  conviction: Conviction,
): TimelineConflict | null {
  if (compareIso(episode.commitDate, conviction.effectiveDate) < 0) return null;

  const triggers: ConvictionStatus[] = [
    ConvictionStatus.PartiallyServed,
    ConvictionStatus.Conditional,
    ConvictionStatus.ConditionalRevoked,
    ConvictionStatus.Parole,
    ConvictionStatus.ParoleRevoked,
  ];
  if (!triggers.includes(conviction.status)) return null;

  return {
    ruleId: 'T-070',
    episodeId: episode.id,
    convictionId: conviction.id,
    message:
      `Эпизод ${episode.articleNumber} ч. ${episode.articlePart} (${episode.commitDate}) ` +
      `совершён в период действия неотбытого приговора от ${conviction.effectiveDate}. ` +
      `Совокупность приговоров — ст. 70 УК.`,
  };
}

/** Полный список конфликтов по всем парам (эпизод × приговор). */
export function detectTimelineConflicts(
  episodes: Episode[],
  convictions: Conviction[],
): TimelineConflict[] {
  const out: TimelineConflict[] = [];
  for (const e of episodes) {
    for (const c of convictions) {
      const a = detectArt69_5Conflict(e, c);
      if (a) out.push(a);
      const b = detectArt70Conflict(e, c);
      if (b) out.push(b);
    }
  }
  return out;
}

/**
 * Внутренние типы движка.
 *
 * Все срочные наказания внутри движка считаются в ДНЯХ (1 год = 360 дней,
 * 1 месяц = 30 дней — соответствует эквивалентам УК ст. 71/72). Перевод в
 * Duration {years, months, days} делается только при вывод в UI и в PDF.
 */

import type { PunishmentKind } from '@domain/enums';
import type { RuleApplication } from '@domain/types';

export interface Range {
  /** Нижний предел в днях (или часах для обяз. работ, рублях для штрафа). */
  min: number;
  /** Верхний предел в тех же единицах. */
  max: number;
}

export interface EngineLog {
  steps: RuleApplication[];
  warnings: string[];
}

export interface EpisodeCalc {
  episodeId: string;
  punishmentKind: PunishmentKind;
  /** Исходная санкция (как в УК). */
  baseRange: Range;
  /** Итоговый диапазон после применения всех коэффициентов. */
  finalRange: Range;
  log: RuleApplication[];
  warnings: string[];
}

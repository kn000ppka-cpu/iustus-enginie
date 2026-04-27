/**
 * Этап 5. Polish: режим (ст. 58) + зачёт (ст. 72) + УО (ст. 73).
 *
 * Принимает CalculationResult с Этапа 4 и расширяет его:
 *   • facility — рекомендованный режим;
 *   • finalRangeAfterZachet — диапазон после вычета зачёта по периодам СИЗО /
 *     домашнего ареста / задержания;
 *   • conditional — оценка доступности УО.
 *
 * Полный лог Этапа 5 добавляется в `result.log`.
 */

import type {
  CalculationResult,
  CaseFile,
  PolishConfig,
  RuleApplication,
  UkArticle,
} from '@domain/types';

import { enrichConvictions } from '@legal/detectors/conviction-enrich';

import { determineFacility, isOneToOneOnly } from './regime';
import { applyZacet, computeZacet } from './zacet';
import { evaluateConditional, recommendProbation, type ConditionalResult } from './conditional';
import type { Range } from '../types';

export interface PolishResult extends CalculationResult {
  /** Диапазон после вычета зачёта (в днях). */
  finalRangeAfterZachet: Range;
  /** Сумма зачёта в днях ЛС. */
  totalCreditDays: number;
  /** Условное осуждение — доступно/нет, причина. */
  conditional: ConditionalResult;
  /** Рекомендация по испытательному сроку, если УО доступно. */
  probation?: { minDays: number; maxDays: number };
}

export function runPolish(
  base: CalculationResult,
  caseFile: CaseFile,
  articles: UkArticle[],
): PolishResult {
  const trialDate =
    caseFile.context.trialDate ?? new Date().toISOString().slice(0, 10);
  const polish: PolishConfig = caseFile.polish;

  // Нормализуем приговоры (auto-worstCategory из composition).
  const enrichedConvictions = enrichConvictions(caseFile.convictions, articles);

  const additionalLog: RuleApplication[] = [];
  const additionalWarnings: string[] = [];

  // 1. Режим ст. 58
  const regime = determineFacility({
    subject: caseFile.subject,
    trialDate,
    episodes: caseFile.episodes,
    articles,
    recidivism: base.recidivism,
    convictions: enrichedConvictions,
  });
  additionalLog.push(...regime.log);

  // 2. Исключение 1:1 (особо опасный рецидив или террор. составы)
  const oneToOne = isOneToOneOnly({
    recidivism: base.recidivism,
    episodes: caseFile.episodes,
    articles,
  });
  if (oneToOne.applies) {
    additionalLog.push({
      ruleId: 'P-072-EXCL',
      norm: 'УК ст. 72 ч. 3.2',
      description: oneToOne.reason,
    });
  }

  // 3. Зачёт ст. 72
  const zacet = computeZacet({
    facility: regime.facility,
    oneToOneOnly: oneToOne.applies,
    periods: polish.detentionPeriods,
  });
  additionalLog.push(...zacet.log);
  additionalWarnings.push(...zacet.warnings);

  const finalRangeAfterZachet = applyZacet(base.finalRange, zacet.totalCreditDays);

  // 4. Условное осуждение ст. 73 — оцениваем по диапазону ДО зачёта,
  // т. к. реальное наказание это «то, что назначено» (ст. 73 ч. 1).
  const conditional = evaluateConditional({
    finalRange: base.finalRange,
    recidivism: base.recidivism,
    episodes: caseFile.episodes,
    articles,
    convictions: enrichedConvictions,
  });
  additionalLog.push(...conditional.log);

  return {
    ...base,
    facility: regime.facility,
    finalRangeAfterZachet,
    totalCreditDays: zacet.totalCreditDays,
    conditional,
    probation: conditional.available ? recommendProbation(base.finalRange) : undefined,
    log: [...base.log, ...additionalLog],
    warnings: [...base.warnings, ...additionalWarnings],
  };
}

export { determineFacility, isOneToOneOnly } from './regime';
export { computeZacet, applyZacet, daysBetweenInclusive } from './zacet';
export { evaluateConditional, recommendProbation } from './conditional';

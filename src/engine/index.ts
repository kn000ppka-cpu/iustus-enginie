/**
 * Точка входа движка.
 *
 * Принимает CaseFile + сборку статей УК, возвращает результат расчёта по
 * каждому эпизоду + совокупный диапазон + лог "Путь машины".
 *
 * НЕ выполняет:
 *   • расчёт зачёта СИЗО / домашнего ареста (Этап 5);
 *   • выбор режима ст. 58 (Этап 5);
 *   • расчёт УДО / замены (Этап 6).
 */

import {
  CrimeCategory,
  PunishmentKind,
  RecidivismKind,
} from '@domain/enums';
import type {
  ArticlePart,
  CalculationResult,
  CaseFile,
  Episode,
  RuleApplication,
  UkArticle,
} from '@domain/types';
import { findArticlePart } from '@legal/articles/registry';
import { computeBlockedPunishments } from '@legal/filters/subject-filters';
import {
  activeConvictionsAt,
  detectTimelineConflicts,
  recidivismKindFor,
} from '@legal/detectors/timeline';
import { enrichConvictions } from '@legal/detectors/conviction-enrich';

import { computeEpisode } from './episode';
import { computeAggregate } from './aggregate';
import type { EpisodeCalc } from './types';

const CATEGORY_ORDER: CrimeCategory[] = [
  CrimeCategory.Small,
  CrimeCategory.Medium,
  CrimeCategory.Heavy,
  CrimeCategory.EspeciallyHeavy,
];

export function runEngine(
  caseFile: CaseFile,
  articles: UkArticle[],
): CalculationResult {
  const trialDate =
    caseFile.context.trialDate ?? new Date().toISOString().slice(0, 10);

  // Нормализуем приговоры: если у приговора composition[] заполнен, но
  // worstCategory вручную не задан, авто-вычислим её из реестра. Это нужно,
  // потому что прошлый приговор по совокупности статей даёт «худшую» категорию.
  const enrichedConvictions = enrichConvictions(caseFile.convictions, articles);
  const enrichedCaseFile = { ...caseFile, convictions: enrichedConvictions };

  // 1. Активные судимости + рецидив
  const active = activeConvictionsAt(enrichedConvictions, trialDate);
  const worstEpCategory = worstEpisodeCategory(caseFile.episodes, articles);
  const recidivism = recidivismKindFor(caseFile.subject, worstEpCategory, active);

  // 2. Конфликты Timeline
  const conflicts = detectTimelineConflicts(caseFile.episodes, caseFile.convictions);
  const ids69_5 = new Set(
    conflicts.filter((c) => c.ruleId === 'T-069-5').map((c) => c.convictionId),
  );
  const ids70 = new Set(
    conflicts.filter((c) => c.ruleId === 'T-070').map((c) => c.convictionId),
  );
  const conv69_5 = enrichedConvictions.filter((c) => ids69_5.has(c.id));
  const conv70 = enrichedConvictions.filter((c) => ids70.has(c.id));
  void enrichedCaseFile; // placeholder для будущего использования в подэтапах

  // 3. Расчёт по каждому эпизоду
  const calcs: { episode: Episode; part: ArticlePart; calc: EpisodeCalc }[] = [];
  const fullLog: RuleApplication[] = [];
  const allWarnings: string[] = [];

  for (const ep of caseFile.episodes) {
    const part = findArticlePart(articles, ep.articleNumber, ep.articlePart);
    if (!part) {
      allWarnings.push(
        `Эпизод ${ep.id}: статья ${ep.articleNumber} ч. ${ep.articlePart} не найдена в реестре.`,
      );
      continue;
    }
    const calc = computeEpisode(ep, part, {
      subject: caseFile.subject,
      trialDate,
      specialProcedure: caseFile.context.specialProcedure,
      preTrialAgreement: caseFile.context.preTrialAgreement,
      juryTrial: caseFile.context.juryTrial,
      recidivism,
    });
    calcs.push({ episode: ep, part, calc });
    fullLog.push(...calc.log);
    allWarnings.push(...calc.warnings);
  }

  // 4. Совокупность
  const aggregate = computeAggregate({
    episodes: calcs,
    pendingConvictions69_5: conv69_5,
    pendingConvictions70: conv70,
  });
  fullLog.push(...aggregate.log);
  allWarnings.push(...aggregate.warnings);

  // 5. Запрещённые виды наказания (с Этапа 1) — для UI / валидации
  const blockedMap = computeBlockedPunishments(caseFile.subject, trialDate);
  const blockedPunishments = Object.keys(blockedMap) as PunishmentKind[];

  return {
    episodes: calcs.map(({ calc }) => ({
      episodeId: calc.episodeId,
      punishmentKind: calc.punishmentKind,
      range: { min: calc.finalRange.min, max: calc.finalRange.max },
      log: calc.log,
    })),
    aggregate:
      aggregate.kind === 'single'
        ? undefined
        : {
            kind: aggregate.kind,
            range: aggregate.range,
            log: aggregate.log,
          },
    finalRange: aggregate.range,
    blockedPunishments,
    recidivism,
    log: fullLog,
    warnings: allWarnings,
  };
}

// ────────────────────────────────────────────────────────────────────────────

function worstEpisodeCategory(
  episodes: Episode[],
  articles: UkArticle[],
): CrimeCategory {
  if (episodes.length === 0) return CrimeCategory.Small;
  return episodes.reduce<CrimeCategory>((acc, ep) => {
    const part = findArticlePart(articles, ep.articleNumber, ep.articlePart);
    const c = ep.effectiveCategory ?? part?.category ?? CrimeCategory.Small;
    return CATEGORY_ORDER.indexOf(c) > CATEGORY_ORDER.indexOf(acc) ? c : acc;
  }, CrimeCategory.Small);
}

// Re-exports
export type { EpisodeCalc, Range, EngineLog } from './types';
export { computeEpisode } from './episode';
export { computeAggregate } from './aggregate';
export { daysToDuration, durationToDays, formatDuration, formatDays } from './duration';

// dummy re-export to satisfy noUnusedLocals when consumers don't use RecidivismKind
export const _RecidivismKindRef = RecidivismKind;

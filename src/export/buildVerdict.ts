/**
 * Сборщик резолютивной части приговора по структуре ППВС № 55/2016 пп. 26-31.
 *
 * Возвращает структурированный документ из секций. Используется и в UI
 * (live-preview перед экспортом), и в PDF-экспорте.
 *
 * v1: упрощённая версия. Не покрывает:
 *   • дополнительные виды наказаний;
 *   • сложные случаи с несколькими фигурантами;
 *   • полный перечень специфических указаний (запреты ст. 47 и т. п.).
 */

import {
  CRIME_CATEGORY_LABELS,
  FACILITY_LABELS,
  PUNISHMENT_LABELS,
} from '@domain/enums';
import type { CaseFile, RuleApplication, UkArticle } from '@domain/types';
import { findArticlePart } from '@legal/articles/registry';
import { formatDays } from '@engine/duration';
import type { PolishResult } from '@engine/polish/index';
import type { ParoleResult } from '@engine/release/index';

export interface VerdictDoc {
  /** Шапка: суд, дело, ФИО. */
  heading: string[];
  /** Установочная часть: эпизоды и квалификация. */
  findings: string[];
  /** Резолютивная часть: статьи, наказания, режим, зачёт. */
  resolution: string[];
  /** УДО / замена. */
  releaseInfo: string[];
  /** Полный «Путь машины» — для приложения. */
  enginePath: { ruleId: string; norm: string; description: string; source?: string }[];
}

interface BuildInput {
  caseFile: CaseFile;
  articles: UkArticle[];
  result: PolishResult;
  parole: ParoleResult;
}

const T = (s: string) => s.trim();

export function buildVerdict({
  caseFile,
  articles,
  result,
  parole,
}: BuildInput): VerdictDoc {
  const subjectName = caseFile.subject.fullName?.trim() || '<ФИО подсудимого>';
  const trialDate = caseFile.context.trialDate ?? '—';

  // ── Шапка ─────────────────────────────────────────────────────────────
  const heading = [
    'ПРИГОВОР',
    `Именем Российской Федерации`,
    `г. ___________     ${trialDate}`,
    '',
    `Суд в составе ____________ при ведении протокола ____________, ` +
      `с участием ____________, рассмотрев в ____________ заседании уголовное дело ` +
      `по обвинению ${subjectName} в совершении преступлений, предусмотренных ` +
      `${listEpisodeRefs(caseFile, articles)}.`,
  ];

  // ── Установочная часть ────────────────────────────────────────────────
  const findings: string[] = [];
  caseFile.episodes.forEach((ep, i) => {
    const part = findArticlePart(articles, ep.articleNumber, ep.articlePart);
    findings.push(
      `${i + 1}. ${ep.commitDate} ${subjectName} совершил преступление, ` +
        `предусмотренное ст. ${ep.articleNumber} ч. ${ep.articlePart} УК РФ ` +
        `(${part ? CRIME_CATEGORY_LABELS[part.category].toLowerCase() : 'категория не определена'}). ` +
        `Диспозиция: ${part?.disposition ?? '<требуется ввод>'}.` +
        (ep.flags.art15_6_applied
          ? ' Применена ст. 15 ч. 6 УК — категория изменена на менее тяжкую.'
          : ''),
    );
  });

  // ── Резолютивная часть ────────────────────────────────────────────────
  const resolution: string[] = [];
  result.episodes.forEach((er, i) => {
    const ep = caseFile.episodes.find((x) => x.id === er.episodeId);
    const punishLabel = PUNISHMENT_LABELS[er.punishmentKind];
    resolution.push(
      `${i + 1}. Признать ${subjectName} виновным в совершении преступления, ` +
        `предусмотренного ст. ${ep?.articleNumber} ч. ${ep?.articlePart} УК РФ, ` +
        `и назначить наказание в виде ${punishLabel.toLowerCase()} ` +
        `на срок ${formatDays(er.range.max)} (расчётный диапазон: ` +
        `от ${formatDays(er.range.min)} до ${formatDays(er.range.max)}).`,
    );
  });

  if (result.aggregate) {
    const kind = result.aggregate.kind;
    const norm =
      kind === 'art69_2'
        ? 'ст. 69 ч. 2 УК РФ'
        : kind === 'art69_3'
          ? 'ст. 69 ч. 3 УК РФ'
          : kind === 'art69_5'
            ? 'ст. 69 ч. 5 УК РФ'
            : 'ст. 70 УК РФ';
    resolution.push(
      `На основании ${norm} путём частичного сложения / поглощения назначить ` +
        `окончательное наказание в виде лишения свободы на срок ` +
        `${formatDays(result.finalRange.max)} ` +
        `(диапазон: от ${formatDays(result.finalRange.min)} до ${formatDays(result.finalRange.max)}).`,
    );
  }

  resolution.push(
    `На основании ст. 58 УК РФ местом отбытия наказания определить ` +
      `${result.facility ? FACILITY_LABELS[result.facility].toLowerCase() : '<не определено>'}.`,
  );

  if (result.totalCreditDays > 0) {
    resolution.push(
      `Зачесть в срок отбытия наказания периоды СИЗО / домашнего ареста / ` +
        `задержания общей продолжительностью ${formatDays(result.totalCreditDays)} ` +
        `по правилам ст. 72 УК РФ. ` +
        `Срок к отбытию после зачёта: от ${formatDays(result.finalRangeAfterZachet.min)} ` +
        `до ${formatDays(result.finalRangeAfterZachet.max)}.`,
    );
  }

  if (caseFile.polish.applyConditional && result.conditional.available && result.probation) {
    resolution.push(
      `На основании ст. 73 УК РФ назначенное наказание считать условным ` +
        `с испытательным сроком от ${formatDays(result.probation.minDays)} до ` +
        `${formatDays(result.probation.maxDays)}.`,
    );
  }

  // ── УДО / замена ──────────────────────────────────────────────────────
  const releaseInfo: string[] = [];
  releaseInfo.push(
    `Право на УДО (ст. 79 УК РФ) — после реального отбытия ` +
      `${formatDays(parole.daysServedRequired)} (${parole.reason}).` +
      (parole.earliestDate ? ` Самая ранняя дата подачи ходатайства: ${parole.earliestDate}.` : ''),
  );
  releaseInfo.push(
    `Замена неотбытой части более мягким видом (ст. 80 УК РФ + ст. 71 ч. 1) — ` +
      `по тем же долям; конкретный вид определяется судом по ходатайству.`,
  );

  // ── Путь машины ───────────────────────────────────────────────────────
  const enginePath = result.log.map((l: RuleApplication) => ({
    ruleId: l.ruleId,
    norm: l.norm,
    description: l.description,
    ...(l.source ? { source: l.source } : {}),
  }));

  return {
    heading: heading.map(T),
    findings: findings.map(T),
    resolution: resolution.map(T),
    releaseInfo: releaseInfo.map(T),
    enginePath,
  };
}

function listEpisodeRefs(caseFile: CaseFile, articles: UkArticle[]): string {
  if (caseFile.episodes.length === 0) return '<статьи не указаны>';
  return caseFile.episodes
    .map((ep) => {
      const part = findArticlePart(articles, ep.articleNumber, ep.articlePart);
      const title = part ? `(${part.disposition.slice(0, 40)}…)` : '';
      return `ст. ${ep.articleNumber} ч. ${ep.articlePart} УК РФ ${title}`.trim();
    })
    .join(', ');
}

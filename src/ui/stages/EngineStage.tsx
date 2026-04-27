/**
 * Этап 4. Master Engine — итоговый расчёт.
 *
 * Слева — диапазон по совокупности и разбивка по эпизодам. Справа —
 * полный «Путь машины»: каждое применённое правило с before/after, ссылкой
 * на норму и источник (ППВС). Ниже — предупреждения движка.
 */

import { useMemo } from 'react';
import { useArticlesStore } from '@state/articles-store';
import { useCaseStore } from '@state/case-store';
import { runEngine, formatDays } from '@engine/index';
import type { RuleApplication } from '@domain/types';

import { Card } from '../components/Card';
import styles from './engine.module.css';

export function EngineStage() {
  const caseFile = useCaseStore((s) => s.caseFile);
  const articles = useArticlesStore((s) => s.index());

  const result = useMemo(() => runEngine(caseFile, articles), [caseFile, articles]);

  const hasEpisodes = result.episodes.length > 0;
  const hasInverted = result.finalRange.max < result.finalRange.min;

  return (
    <div className={styles.stack}>
      <Card
        title="Итог (Этап 4)"
        description="Совокупный диапазон после применения всех ст. 66 → 62 → 65 → 68 → 64 и ст. 69 / 70."
      >
        {!hasEpisodes ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
            Эпизодов нет. Добавьте их на Этапе 2 — без эпизодов движок не запускается.
          </p>
        ) : (
          <div className={styles.stack}>
            <div
              className={`${styles.headline} ${hasInverted ? styles.headlineDanger : ''}`}
            >
              <span className={styles.headlineLabel}>
                {result.aggregate ? aggregateLabel(result.aggregate.kind) : 'Без совокупности'}
              </span>
              <span className={styles.headlineRange}>
                от {formatDays(result.finalRange.min)} · до {formatDays(result.finalRange.max)}
              </span>
              <span className={styles.headlineNote}>
                Вид рецидива: {recidivismLabel(result.recidivism)}. Этап 5 (зачёт ст. 72,
                режим ст. 58, ст. 73) ещё не применён.
              </span>
            </div>

            <div>
              <h4
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--text-tertiary)',
                  marginBottom: 6,
                }}
              >
                По эпизодам (после ст. 66 / 62 / 65 / 68 / 64)
              </h4>
              {result.episodes.map((e, i) => {
                const ep = caseFile.episodes.find((x) => x.id === e.episodeId);
                return (
                  <div key={e.episodeId} className={styles.episodeRow}>
                    <span className={styles.episodeIndex}>{i + 1}</span>
                    <span className={styles.episodeTitle}>
                      {ep
                        ? `ст. ${ep.articleNumber} ч. ${ep.articlePart} (${ep.commitDate})`
                        : '—'}
                    </span>
                    <span className={styles.episodeRange}>
                      {formatDays(e.range.min)} · {formatDays(e.range.max)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {result.warnings.length > 0 && (
        <Card title="Предупреждения" tone="warn">
          <div className={styles.stack}>
            {result.warnings.map((w, i) => (
              <div key={i} className={styles.warning}>
                <span className={styles.warningIcon}>!</span>
                <span>{w}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card
        title="Путь машины"
        description={`${result.log.length} ${pluralRules(result.log.length)} применено к расчёту. Каждое — с ссылкой на норму и источник (ППВС).`}
      >
        {result.log.length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
            Никаких коэффициентов не применено. Санкция взята как есть.
          </p>
        ) : (
          <div className={styles.pathList}>
            {result.log.map((step, i) => (
              <PathItem key={`${step.ruleId}-${i}`} step={step} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

function PathItem({ step }: { step: RuleApplication }) {
  const change =
    step.before && step.after
      ? `${formatDays(step.before.max)} → ${formatDays(step.after.max)}`
      : '';
  return (
    <div className={styles.pathItem}>
      <span className={styles.pathRule}>{step.ruleId}</span>
      <div>
        <span className={styles.pathDescription}>{step.description}</span>
        <span className={styles.pathSource}>
          {step.norm}
          {step.source ? ` · ${step.source}` : ''}
        </span>
      </div>
      <span className={styles.pathRangeChange}>{change}</span>
    </div>
  );
}

function aggregateLabel(kind: string): string {
  switch (kind) {
    case 'art69_2':
      return 'Совокупность преступлений · ст. 69 ч. 2';
    case 'art69_3':
      return 'Совокупность преступлений · ст. 69 ч. 3';
    case 'art69_5':
      return 'Совокупность с зачётом отбытого · ст. 69 ч. 5';
    case 'art70':
      return 'Совокупность приговоров · ст. 70';
    default:
      return 'Один эпизод';
  }
}

function recidivismLabel(kind: string): string {
  switch (kind) {
    case 'simple':
      return 'простой';
    case 'dangerous':
      return 'опасный';
    case 'especially_dangerous':
      return 'особо опасный';
    default:
      return 'отсутствует';
  }
}

function pluralRules(n: number): string {
  const last = n % 10;
  const last2 = n % 100;
  if (last2 >= 11 && last2 <= 14) return 'правил';
  if (last === 1) return 'правило';
  if (last >= 2 && last <= 4) return 'правила';
  return 'правил';
}

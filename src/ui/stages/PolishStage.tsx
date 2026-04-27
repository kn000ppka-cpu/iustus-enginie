/**
 * Этап 5. Зачёт и финальная доводка.
 *
 * Слева: список периодов СИЗО / домарест / задержание + переключатель
 * «Применить ст. 73 если возможно».
 * Справа: KPI-блоки —
 *   • рекомендованный режим ст. 58 (с обоснованием);
 *   • сумма зачёта по ст. 72 + диапазон после вычета;
 *   • доступность УО ст. 73 + рекомендация по испытательному сроку.
 */

import { useMemo } from 'react';
import { useArticlesStore } from '@state/articles-store';
import { useCaseStore } from '@state/case-store';
import { runEngine, formatDays } from '@engine/index';
import { runPolish } from '@engine/polish/index';
import { FACILITY_LABELS } from '@domain/enums';

import { Card } from '../components/Card';
import { DetentionPeriodCard } from './polish/DetentionPeriodCard';
import styles from './polish/polish.module.css';

export function PolishStage() {
  const caseFile = useCaseStore((s) => s.caseFile);
  const polish = useCaseStore((s) => s.caseFile.polish);
  const addPeriod = useCaseStore((s) => s.addDetentionPeriod);
  const updatePolish = useCaseStore((s) => s.updatePolish);
  const articles = useArticlesStore((s) => s.index());

  const polishResult = useMemo(() => {
    const base = runEngine(caseFile, articles);
    return runPolish(base, caseFile, articles);
  }, [caseFile, articles]);

  const probationText =
    polishResult.probation
      ? `${formatDays(polishResult.probation.minDays)} — ${formatDays(polishResult.probation.maxDays)}`
      : '';

  return (
    <div className={styles.row}>
      {/* ─── Левая колонка: входные данные ───────────────────────────── */}
      <div className={styles.stack}>
        <Card
          title="Периоды содержания (Этап 5)"
          description="СИЗО, домашний арест и задержание — для зачёта по ст. 72 УК. Длительность считается включительно по обеим датам (ППВС № 21/2011)."
        >
          <div className={styles.list}>
            {polish.detentionPeriods.length === 0 && (
              <div className={styles.empty}>
                Нет ни одного периода содержания. Если СИЗО / домашнего ареста не было —
                раздел можно оставить пустым.
              </div>
            )}
            {polish.detentionPeriods.map((p, i) => (
              <DetentionPeriodCard key={p.id} period={p} index={i} />
            ))}
            <button className={styles.addBtn} onClick={() => addPeriod()}>
              + Добавить период
            </button>
          </div>
        </Card>

        <Card
          title="Условное осуждение (ст. 73)"
          description="Если применимо, движок предложит испытательный срок. Решение остаётся за судом."
        >
          <label
            className={`${styles.toggleRow} ${
              !polishResult.conditional.available ? styles.toggleRowDisabled : ''
            }`}
          >
            <input
              type="checkbox"
              checked={polish.applyConditional}
              disabled={!polishResult.conditional.available}
              onChange={(e) => updatePolish({ applyConditional: e.target.checked })}
              style={{ marginTop: 2 }}
            />
            <span style={{ fontSize: 13, color: 'var(--text)' }}>
              <strong>Применить условное осуждение, если допустимо</strong>
              <span
                style={{
                  display: 'block',
                  marginTop: 2,
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.45,
                }}
              >
                {polishResult.conditional.reason}
              </span>
            </span>
          </label>
        </Card>
      </div>

      {/* ─── Правый рейл: KPI ───────────────────────────────────────── */}
      <div className={styles.stack}>
        <div className={`${styles.kpi} ${styles.kpiAccent}`}>
          <span className={styles.kpiLabel}>Режим (ст. 58)</span>
          <span className={styles.kpiValue}>
            {polishResult.facility ? FACILITY_LABELS[polishResult.facility] : '—'}
          </span>
          <span className={styles.kpiNote}>
            {(polishResult.log.find((l) => l.ruleId.startsWith('P-058'))?.description) ?? ''}
          </span>
        </div>

        <div className={styles.kpi}>
          <span className={styles.kpiLabel}>Зачёт ст. 72</span>
          <span className={styles.kpiValue}>
            {polishResult.totalCreditDays > 0
              ? formatDays(polishResult.totalCreditDays)
              : '— нет периодов'}
          </span>
          <span className={styles.kpiNote}>
            Применённые правила:{' '}
            {polishResult.log
              .filter((l) => l.ruleId.startsWith('P-072'))
              .map((l) => l.ruleId)
              .join(', ') || 'нет'}
          </span>
        </div>

        <div className={`${styles.kpi} ${styles.kpiAccent}`}>
          <span className={styles.kpiLabel}>Финал после зачёта</span>
          <span className={styles.kpiValue}>
            от {formatDays(polishResult.finalRangeAfterZachet.min)}
            {' · '}
            до {formatDays(polishResult.finalRangeAfterZachet.max)}
          </span>
          <span className={styles.kpiNote}>
            До зачёта: от {formatDays(polishResult.finalRange.min)} до{' '}
            {formatDays(polishResult.finalRange.max)}.
          </span>
        </div>

        <div
          className={`${styles.kpi} ${
            polishResult.conditional.available ? styles.kpiAccent : styles.kpiBlocked
          }`}
        >
          <span className={styles.kpiLabel}>Условное осуждение</span>
          <span className={styles.kpiValue}>
            {polishResult.conditional.available ? 'Доступно' : 'Не применяется'}
          </span>
          <span className={styles.kpiNote}>
            {polishResult.conditional.reason}
            {polishResult.probation && (
              <>
                <br />
                Испытательный срок: <strong>{probationText}</strong>.
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

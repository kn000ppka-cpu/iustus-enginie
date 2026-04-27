/**
 * Карточка одного периода: СИЗО / домашний арест / задержание.
 * Длительность считается включительно по обоим краям, как в ст. 72 УК.
 */

import { useCaseStore } from '@state/case-store';
import type { DetentionPeriod, DetentionRegime } from '@domain/types';
import { daysBetweenInclusive } from '@engine/polish/index';
import { formatDays } from '@engine/index';

import styles from './polish.module.css';

const REGIME_OPTIONS: { value: DetentionRegime; label: string }[] = [
  { value: 'custody', label: 'Содержание под стражей (СИЗО)' },
  { value: 'house_arrest', label: 'Домашний арест' },
  { value: 'detained', label: 'Задержание' },
];

interface Props {
  period: DetentionPeriod;
  index: number;
}

export function DetentionPeriodCard({ period, index }: Props) {
  const update = useCaseStore((s) => s.updateDetentionPeriod);
  const remove = useCaseStore((s) => s.removeDetentionPeriod);
  const days = daysBetweenInclusive(period.from, period.to);

  return (
    <article className={styles.periodCard}>
      <header className={styles.periodHeader}>
        <span className={styles.periodTitle}>
          Период {index + 1} · {days > 0 ? formatDays(days) : '— некорректный диапазон —'}
        </span>
        <button
          className={styles.removeBtn}
          onClick={() => {
            if (window.confirm('Удалить период?')) remove(period.id);
          }}
        >
          Удалить
        </button>
      </header>
      <div className={styles.periodGrid}>
        <div>
          <label className={styles.label}>Вид</label>
          <select
            className={styles.select}
            value={period.regime}
            onChange={(e) =>
              update(period.id, { regime: e.target.value as DetentionRegime })
            }
          >
            {REGIME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={styles.label}>с</label>
          <input
            type="date"
            className={styles.input}
            value={period.from}
            onChange={(e) => update(period.id, { from: e.target.value })}
          />
        </div>
        <div>
          <label className={styles.label}>по (включительно)</label>
          <input
            type="date"
            className={styles.input}
            value={period.to}
            onChange={(e) => update(period.id, { to: e.target.value })}
          />
        </div>
      </div>
    </article>
  );
}

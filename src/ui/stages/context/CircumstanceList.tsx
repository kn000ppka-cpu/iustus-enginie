/**
 * Чек-лист обстоятельств (смягчающих или отягчающих).
 * Использует пометку triggersArt62_1 для подсветки «и»/«к».
 */

import type { Circumstance } from '@legal/data/circumstances';
import styles from './context.module.css';

interface CircumstanceListProps {
  items: Circumstance[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export function CircumstanceList({
  items,
  selectedIds,
  onToggle,
}: CircumstanceListProps) {
  const sel = new Set(selectedIds);
  return (
    <div className={styles.checklist}>
      {items.map((c) => {
        const active = sel.has(c.id);
        return (
          <div
            key={c.id}
            className={`${styles.checkRow} ${active ? styles.checkRowActive : ''}`}
            onClick={() => onToggle(c.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                onToggle(c.id);
              }
            }}
          >
            <span
              className={`${styles.checkBoxOuter} ${
                active ? styles.checkBoxOuterActive : ''
              }`}
            >
              {active && '✓'}
            </span>
            <span className={styles.checkLabel}>
              {c.label}
              {c.triggersArt62_1 && (
                <span className={styles.triggerBadge}>ст. 62 ч. 1</span>
              )}
              {c.hint && <span className={styles.checkLabelHint}>{c.hint}</span>}
            </span>
            <span className={styles.checkNorm}>{c.norm}</span>
          </div>
        );
      })}
    </div>
  );
}

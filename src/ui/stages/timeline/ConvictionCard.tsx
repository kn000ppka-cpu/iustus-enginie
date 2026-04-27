/**
 * Карточка прошлого приговора.
 *
 * Поддерживает приговор по совокупности (массив `composition[]`):
 *   • add/remove статей,
 *   • авто-вычисление худшей категории через реестр (видна в select-опции
 *     «Авто: …»);
 *   • ручной override `worstCategory` остаётся доступен.
 *
 * Дата = дата вступления в силу (глобальный принцип № 2).
 * Период УДО НЕ включается в `actuallyServed` (глобальный принцип № 1).
 */

import { useMemo } from 'react';

import { useArticlesStore } from '@state/articles-store';
import { useCaseStore } from '@state/case-store';
import { autoWorstCategory } from '@legal/detectors/conviction-enrich';
import {
  CRIME_CATEGORY_LABELS,
  ConvictionStatus,
  CrimeCategory,
} from '@domain/enums';
import type { Conviction, Duration as TermDuration } from '@domain/types';

import { ArticlePicker } from './ArticlePicker';
import styles from './timeline.module.css';

const STATUS_OPTIONS: { value: ConvictionStatus; label: string }[] = [
  { value: 'served', label: 'Полностью отбыто' },
  { value: 'partially_served', label: 'Отбывается частично' },
  { value: 'conditional', label: 'Условное (ст. 73)' },
  { value: 'conditional_revoked', label: 'УО отменено (ст. 74)' },
  { value: 'parole', label: 'На УДО (ст. 79)' },
  { value: 'parole_revoked', label: 'УДО отменено' },
  { value: 'replaced', label: 'Заменено более мягким (ст. 80)' },
  { value: 'pardoned', label: 'Помилован' },
  { value: 'amnesty', label: 'Освобождён по амнистии' },
  { value: 'expunged', label: 'Судимость погашена/снята (ст. 86)' },
];

const CATEGORY_OPTIONS: { value: CrimeCategory; label: string }[] = (
  Object.keys(CRIME_CATEGORY_LABELS) as CrimeCategory[]
).map((c) => ({ value: c, label: CRIME_CATEGORY_LABELS[c] }));

interface ConvictionCardProps {
  conviction: Conviction;
  index: number;
}

export function ConvictionCard({ conviction, index }: ConvictionCardProps) {
  const articles = useArticlesStore((s) => s.index());
  const updateConviction = useCaseStore((s) => s.updateConviction);
  const removeConviction = useCaseStore((s) => s.removeConviction);

  const composition = conviction.composition;
  const sentenceDuration = conviction.sentence.duration;

  const autoWorst = useMemo(
    () => autoWorstCategory(composition, articles),
    [composition, articles],
  );

  const updateCompositionAt = (idx: number, article: string, part: string) => {
    const next = composition.map((c, i) => (i === idx ? { article, part } : c));
    updateConviction(conviction.id, { composition: next });
  };

  const removeCompositionAt = (idx: number) => {
    const next = composition.filter((_, i) => i !== idx);
    updateConviction(conviction.id, { composition: next });
  };

  const addComposition = () => {
    updateConviction(conviction.id, {
      composition: [...composition, { article: '', part: '1' }],
    });
  };

  const updateSentenceDuration = (patch: Partial<TermDuration>) => {
    updateConviction(conviction.id, {
      sentence: {
        ...conviction.sentence,
        duration: { ...sentenceDuration, ...patch },
      },
    });
  };

  const updateActuallyServed = (patch: Partial<TermDuration>) => {
    const current = conviction.actuallyServed ?? { years: 0, months: 0, days: 0 };
    updateConviction(conviction.id, {
      actuallyServed: { ...current, ...patch },
    });
  };

  return (
    <article className={styles.card}>
      <header className={styles.cardHeader}>
        <span className={styles.cardTitle}>
          <span className={styles.indexBadge}>{index + 1}</span>
          Прошлый приговор
        </span>
        <button
          className={styles.removeBtn}
          onClick={() => {
            if (window.confirm('Удалить приговор?')) removeConviction(conviction.id);
          }}
        >
          Удалить
        </button>
      </header>

      <div className={styles.fieldGrid}>
        <div>
          <label className={styles.label}>Дата вступления в силу</label>
          <input
            type="date"
            className={styles.input}
            value={conviction.effectiveDate}
            onChange={(e) =>
              updateConviction(conviction.id, { effectiveDate: e.target.value })
            }
          />
        </div>

        <div>
          <label className={styles.label}>Суд (опц.)</label>
          <input
            className={styles.input}
            value={conviction.court ?? ''}
            placeholder="напр. Мещанский районный суд г. Москвы"
            onChange={(e) =>
              updateConviction(conviction.id, { court: e.target.value || undefined })
            }
          />
        </div>

        <div className={styles.fieldGridFull}>
          <label className={styles.label}>
            Состав(ы) приговора · {composition.length === 0
              ? 'не указаны'
              : composition.length === 1
                ? '1 статья'
                : `совокупность ${composition.length} статей`}
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {composition.length === 0 && (
              <div
                style={{
                  padding: 10,
                  border: '1px dashed var(--border-strong)',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'center',
                  color: 'var(--text-tertiary)',
                  fontSize: 12,
                }}
              >
                Ни одна статья не указана. Добавьте хотя бы одну — иначе нельзя вычислить категорию для расчёта рецидива.
              </div>
            )}
            {composition.map((c, i) => (
              <div
                key={i}
                style={{ display: 'flex', gap: 8, alignItems: 'center' }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--text-tertiary)',
                    minWidth: 20,
                  }}
                >
                  {i + 1}.
                </span>
                <div style={{ flex: 1 }}>
                  <ArticlePicker
                    articleNumber={c.article}
                    articlePart={c.part}
                    onChange={(num, p) => updateCompositionAt(i, num, p)}
                  />
                </div>
                <button
                  className={styles.removeBtn}
                  onClick={() => removeCompositionAt(i)}
                  title="Удалить состав"
                  style={{ flexShrink: 0 }}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              className={styles.removeBtn}
              onClick={addComposition}
              style={{
                alignSelf: 'flex-start',
                color: 'var(--accent-text)',
                borderColor: 'var(--accent)',
              }}
            >
              + Добавить состав
            </button>
          </div>
        </div>

        <div>
          <label className={styles.label}>Категория самого тяжкого состава</label>
          <select
            className={styles.select}
            value={conviction.worstCategory ?? ''}
            onChange={(e) =>
              updateConviction(conviction.id, {
                worstCategory: (e.target.value || undefined) as
                  | CrimeCategory
                  | undefined,
              })
            }
          >
            <option value="">
              {autoWorst
                ? `— Авто: ${CRIME_CATEGORY_LABELS[autoWorst]} —`
                : '— Авто (составы не выбраны) —'}
            </option>
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                Переопределить: {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={styles.label}>Статус</label>
          <select
            className={styles.select}
            value={conviction.status}
            onChange={(e) =>
              updateConviction(conviction.id, {
                status: e.target.value as ConvictionStatus,
              })
            }
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.fieldGridFull}>
          <label className={styles.label}>
            Назначенный срок ЛС (итоговый по совокупности приговора)
          </label>
          <DurationFields
            value={sentenceDuration}
            onChange={updateSentenceDuration}
          />
        </div>

        <div>
          <label className={styles.label}>Дата начала отбытия (включая СИЗО)</label>
          <input
            type="date"
            className={styles.input}
            value={conviction.servingStartDate ?? ''}
            onChange={(e) =>
              updateConviction(conviction.id, {
                servingStartDate: e.target.value || undefined,
              })
            }
          />
        </div>

        <div className={styles.fieldGridFull}>
          <label className={styles.label}>
            Фактически отбытый срок (БЕЗ периода УДО)
          </label>
          <DurationFields
            value={conviction.actuallyServed ?? { years: 0, months: 0, days: 0 }}
            onChange={updateActuallyServed}
          />
        </div>
      </div>
    </article>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Subcomponent: ввод Duration
// ────────────────────────────────────────────────────────────────────────────

function DurationFields({
  value,
  onChange,
}: {
  value: TermDuration;
  onChange: (patch: Partial<TermDuration>) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <NumField label="лет" value={value.years} onChange={(n) => onChange({ years: n })} />
      <NumField
        label="мес."
        value={value.months}
        onChange={(n) => onChange({ months: n })}
        max={11}
      />
      <NumField label="дн." value={value.days} onChange={(n) => onChange({ days: n })} max={29} />
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  max,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  max?: number;
}) {
  return (
    <label
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        gap: 2,
        fontSize: 11,
        color: 'var(--text-tertiary)',
      }}
    >
      {label}
      <input
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        style={{
          padding: '6px 8px',
          border: '1px solid var(--border-strong)',
          borderRadius: 4,
          fontSize: 13,
        }}
      />
    </label>
  );
}

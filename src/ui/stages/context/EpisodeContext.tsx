/**
 * Per-episode панель контекста.
 *
 * Под каждым эпизодом — два чек-листа (смягчающие / отягчающие), три флага
 * (ст. 62 ч. 1, ст. 64, ст. 65) и кнопка «Применить ст. 15 ч. 6».
 *
 * Логика:
 *   • ст. 62 ч. 1 (E-062-1) — авто-сигнал, если выбран хотя бы один смягчающий
 *     и/к и нет отягчающих. Пользователь подтверждает галочкой.
 *   • ст. 64 (E-064) — флаг исключительных обстоятельств, ставит судья.
 *   • ст. 65 — снисхождение присяжных. Активен только если глобально
 *     включён `juryTrial`.
 *   • ст. 15 ч. 6 — переключает effectiveCategory на «на одну ступень ниже».
 *     Рекомендация UI: применять только если есть смягчающие, нет отягчающих
 *     и фактически назначенное наказание укладывается в порог. Реальная
 *     валидация — на Этапе 4.
 */

import { useArticlesStore } from '@state/articles-store';
import { useCaseStore } from '@state/case-store';
import { findArticlePart } from '@legal/articles/registry';
import { CRIME_CATEGORY_LABELS, CrimeCategory } from '@domain/enums';
import type { Episode } from '@domain/types';
import {
  AGGRAVATING,
  MITIGATING,
  hasArt62_1Trigger,
} from '@legal/data/circumstances';

import { CircumstanceList } from './CircumstanceList';
import styles from './context.module.css';

const ONE_STEP_DOWN: Record<CrimeCategory, CrimeCategory> = {
  small: CrimeCategory.Small, // некуда снижать
  medium: CrimeCategory.Small,
  heavy: CrimeCategory.Medium,
  especially_heavy: CrimeCategory.Heavy,
};

interface EpisodeContextProps {
  episode: Episode;
  index: number;
  juryTrial: boolean;
}

export function EpisodeContext({ episode, index, juryTrial }: EpisodeContextProps) {
  const articles = useArticlesStore((s) => s.index());
  const updateEpisodeFlags = useCaseStore((s) => s.updateEpisodeFlags);
  const updateEpisode = useCaseStore((s) => s.updateEpisode);

  const part = findArticlePart(articles, episode.articleNumber, episode.articlePart);
  const baseCategory = part?.category ?? CrimeCategory.Small;
  const flags = episode.flags;

  const toggleMitigating = (id: string) => {
    const set = new Set(flags.mitigatingIds);
    set.has(id) ? set.delete(id) : set.add(id);
    updateEpisodeFlags(episode.id, { mitigatingIds: [...set] });
  };

  const toggleAggravating = (id: string) => {
    const set = new Set(flags.aggravatingIds);
    set.has(id) ? set.delete(id) : set.add(id);
    updateEpisodeFlags(episode.id, { aggravatingIds: [...set] });
  };

  const hasIK = hasArt62_1Trigger(flags.mitigatingIds);
  const hasAggravating = flags.aggravatingIds.length > 0;
  const art62_1Recommended = hasIK && !hasAggravating;

  // ст. 15 ч. 6 — рекомендация
  const art156Eligible =
    baseCategory !== CrimeCategory.Small &&
    flags.mitigatingIds.length > 0 &&
    !hasAggravating;
  const downgradedCategory = ONE_STEP_DOWN[baseCategory];

  const toggleArt156 = () => {
    const next = !flags.art15_6_applied;
    updateEpisodeFlags(episode.id, { art15_6_applied: next });
    updateEpisode(episode.id, {
      effectiveCategory: next ? downgradedCategory : undefined,
    });
  };

  return (
    <article className={styles.episodeBlock}>
      <header className={styles.episodeHeader}>
        <span className={styles.episodeTitle}>
          Эпизод {index + 1} ·{' '}
          {episode.articleNumber
            ? `ст. ${episode.articleNumber} ч. ${episode.articlePart}`
            : '— статья не выбрана'}
        </span>
        <span className={styles.episodeMeta}>
          {part ? CRIME_CATEGORY_LABELS[baseCategory] : 'категория ?'}
          {flags.art15_6_applied && baseCategory !== CrimeCategory.Small && (
            <>
              {' '}
              → <strong>{CRIME_CATEGORY_LABELS[downgradedCategory]}</strong>
            </>
          )}
        </span>
      </header>

      <div className={styles.split}>
        <div>
          <h4
            style={{
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--text-tertiary)',
              marginBottom: 8,
            }}
          >
            Смягчающие · ст. 61 ч. 1
          </h4>
          <CircumstanceList
            items={MITIGATING}
            selectedIds={flags.mitigatingIds}
            onToggle={toggleMitigating}
          />
        </div>
        <div>
          <h4
            style={{
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--text-tertiary)',
              marginBottom: 8,
            }}
          >
            Отягчающие · ст. 63 ч. 1
          </h4>
          <CircumstanceList
            items={AGGRAVATING}
            selectedIds={flags.aggravatingIds}
            onToggle={toggleAggravating}
          />
        </div>
      </div>

      {/* Флаги особых правил ─────────────────────────────────────────── */}
      <div className={styles.flagsRow}>
        <FlagRow
          label="ст. 62 ч. 1 — смягчающие «и»/«к» при отсутствии отягчающих"
          subtext={
            art62_1Recommended
              ? '✓ Условия выполнены. При активации: max × 2/3.'
              : hasIK && hasAggravating
                ? 'Есть «и»/«к», но также есть отягчающие → ст. 62 ч. 1 не применяется.'
                : 'Не применяется без хотя бы одного из смягчающих «и» или «к».'
          }
          checked={flags.art62_1}
          onToggle={(v) => updateEpisodeFlags(episode.id, { art62_1: v })}
          disabled={!art62_1Recommended}
        />
        <FlagRow
          label="ст. 64 — исключительные обстоятельства (ниже низшего)"
          subtext="Активирует E-064: MIN = 0, либо более мягкий вид, либо отказ от обяз. дополнительного. Запрещена для составов из ч. 3 ст. 64 (террор., полов. против детей)."
          checked={flags.art64}
          onToggle={(v) => updateEpisodeFlags(episode.id, { art64: v })}
        />
        <FlagRow
          label="ст. 65 — снисхождение присяжных"
          subtext={
            juryTrial
              ? 'Доступно: дело рассматривал суд присяжных (см. блок «Глобально» выше).'
              : 'Недоступно: установите глобальный флаг «Дело рассматривал суд присяжных».'
          }
          checked={flags.art65}
          onToggle={(v) => updateEpisodeFlags(episode.id, { art65: v })}
          disabled={!juryTrial}
        />
      </div>

      {/* ст. 15 ч. 6 — отдельная кнопка ───────────────────────────────── */}
      {baseCategory !== CrimeCategory.Small && (
        <div className={styles.art156Box}>
          <div className={styles.art156Header}>
            <span className={styles.art156Title}>
              ст. 15 ч. 6 — изменение категории на менее тяжкую
            </span>
            <button
              className={`${styles.art156Toggle} ${
                flags.art15_6_applied ? styles.art156ToggleActive : ''
              }`}
              onClick={toggleArt156}
            >
              {flags.art15_6_applied ? 'Применено ✓' : 'Применить, если возможно'}
            </button>
          </div>
          <p className={styles.art156Note}>
            При применении категория эпизода: <strong>{CRIME_CATEGORY_LABELS[baseCategory]}</strong>{' '}
            → <strong>{CRIME_CATEGORY_LABELS[downgradedCategory]}</strong>.
            {art156Eligible
              ? ' Условия по доктрине: смягчающие есть, отягчающих нет. Финальная проверка по фактически назначенному наказанию — Этап 4.'
              : ' Внимание: формальные условия (смягчающие без отягчающих) сейчас не выполнены. Применение возможно, но требует обоснования (ППВС № 10/2018).'}
          </p>
        </div>
      )}
    </article>
  );
}

// ────────────────────────────────────────────────────────────────────────────

interface FlagRowProps {
  label: string;
  subtext: string;
  checked: boolean;
  onToggle: (next: boolean) => void;
  disabled?: boolean;
}

function FlagRow({ label, subtext, checked, onToggle, disabled }: FlagRowProps) {
  return (
    <label
      className={`${styles.flagItem} ${checked ? styles.flagItemActive : ''} ${
        disabled ? styles.flagDisabled : ''
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onToggle(e.target.checked)}
        style={{ marginTop: 2 }}
      />
      <span className={styles.flagText}>
        {label}
        <span className={styles.flagSubtext}>{subtext}</span>
      </span>
    </label>
  );
}

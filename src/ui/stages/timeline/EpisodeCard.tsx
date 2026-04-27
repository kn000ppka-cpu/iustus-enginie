/**
 * Карточка одного эпизода.
 *
 * Поля: дата совершения, статья + часть, стадия (оконченное/приготовление/
 * покушение), роль соучастника. Под выбором статьи — превью диспозиции из
 * каталога. Категория тоже подсвечивается из реестра.
 */

import { useArticlesStore } from '@state/articles-store';
import { useCaseStore } from '@state/case-store';
import { findArticlePart } from '@legal/articles/registry';
import {
  CRIME_CATEGORY_LABELS,
  ComplicityRole,
  Stage,
} from '@domain/enums';
import type { Episode } from '@domain/types';

import { ArticlePicker } from './ArticlePicker';
import styles from './timeline.module.css';

const STAGE_OPTIONS: { value: Stage; label: string }[] = [
  { value: 'completed', label: 'Оконченное' },
  { value: 'preparation', label: 'Приготовление (ст. 30 ч. 1)' },
  { value: 'attempt', label: 'Покушение (ст. 30 ч. 3)' },
];

const ROLE_OPTIONS: { value: ComplicityRole; label: string }[] = [
  { value: 'solo', label: 'Единолично' },
  { value: 'executor', label: 'Исполнитель' },
  { value: 'organizer', label: 'Организатор' },
  { value: 'instigator', label: 'Подстрекатель' },
  { value: 'accomplice', label: 'Пособник' },
];

interface EpisodeCardProps {
  episode: Episode;
  index: number;
}

export function EpisodeCard({ episode, index }: EpisodeCardProps) {
  const articles = useArticlesStore((s) => s.index());
  const updateEpisode = useCaseStore((s) => s.updateEpisode);
  const removeEpisode = useCaseStore((s) => s.removeEpisode);

  const part = findArticlePart(articles, episode.articleNumber, episode.articlePart);

  return (
    <article className={styles.card}>
      <header className={styles.cardHeader}>
        <span className={styles.cardTitle}>
          <span className={styles.indexBadge}>{index + 1}</span>
          Эпизод
        </span>
        <button
          className={styles.removeBtn}
          onClick={() => {
            if (window.confirm('Удалить эпизод?')) removeEpisode(episode.id);
          }}
        >
          Удалить
        </button>
      </header>

      <div className={styles.fieldGrid}>
        <div>
          <label className={styles.label}>Дата совершения</label>
          <input
            type="date"
            className={styles.input}
            value={episode.commitDate}
            onChange={(e) => updateEpisode(episode.id, { commitDate: e.target.value })}
          />
        </div>

        <div>
          <label className={styles.label}>Стадия</label>
          <select
            className={styles.select}
            value={episode.stage}
            onChange={(e) => updateEpisode(episode.id, { stage: e.target.value as Stage })}
          >
            {STAGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.fieldGridFull}>
          <label className={styles.label}>Статья + часть</label>
          <ArticlePicker
            articleNumber={episode.articleNumber}
            articlePart={episode.articlePart}
            onChange={(num, p) =>
              updateEpisode(episode.id, { articleNumber: num, articlePart: p })
            }
          />
          {part && (
            <div className={styles.dispositionPreview}>
              <strong>Диспозиция.</strong> {part.disposition}
            </div>
          )}
        </div>

        <div>
          <label className={styles.label}>Роль соучастника</label>
          <select
            className={styles.select}
            value={episode.role}
            onChange={(e) =>
              updateEpisode(episode.id, { role: e.target.value as ComplicityRole })
            }
          >
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={styles.label}>Категория</label>
          <div className={styles.metaRow}>
            {part ? (
              <span className={styles.metaTagAccent}>
                {CRIME_CATEGORY_LABELS[part.category]}
              </span>
            ) : (
              <span className={styles.metaTag}>не определена</span>
            )}
            {part?.isTerrorism && <span className={styles.metaTagWarn}>террор. состав</span>}
            {part?.isSexualAgainstMinor && (
              <span className={styles.metaTagWarn}>против лица до 14 лет</span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

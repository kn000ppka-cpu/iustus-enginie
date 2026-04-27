/**
 * Этап 2. Хронология эпизодов и прошлых приговоров.
 *
 * Левая колонка — два списка: «Эпизоды» (вменяемые преступления) и
 * «Прошлые приговоры». Правая колонка — живые баннеры:
 *   • вид рецидива по ст. 18 (T-018);
 *   • список конфликтов «эпизод vs приговор»: T-069-5, T-070.
 *
 * Логика расчёта — в `legal/detectors/timeline.ts`.
 */

import { useMemo } from 'react';
import { useCaseStore } from '@state/case-store';
import { useArticlesStore } from '@state/articles-store';
import { findArticlePart } from '@legal/articles/registry';
import {
  activeConvictionsAt,
  detectTimelineConflicts,
  recidivismKindFor,
} from '@legal/detectors/timeline';
import { enrichConvictions } from '@legal/detectors/conviction-enrich';
import { CrimeCategory, RecidivismKind } from '@domain/enums';

import { Card } from '../components/Card';
import { EpisodeCard } from './timeline/EpisodeCard';
import { ConvictionCard } from './timeline/ConvictionCard';
import styles from './timeline/timeline.module.css';

const RECIDIVISM_LABEL: Record<RecidivismKind, string> = {
  none: 'Рецидив отсутствует',
  simple: 'Простой рецидив',
  dangerous: 'Опасный рецидив',
  especially_dangerous: 'Особо опасный рецидив',
};

const RECIDIVISM_DESCRIPTION: Record<RecidivismKind, string> = {
  none: 'По имеющимся данным признаков рецидива нет (ст. 18 УК).',
  simple:
    'Простой рецидив — при назначении наказания применяется ст. 68 ч. 2 УК (нижний порог 1/3 от max).',
  dangerous:
    'Опасный рецидив — режим строгий (ст. 58 ч. 1 п. «в»); зачёт СИЗО только 1:1 (ст. 72 ч. 3.2).',
  especially_dangerous:
    'Особо опасный рецидив — режим особый (ст. 58 ч. 1 п. «г»); запрет ст. 73 (УО); запрет 1:1.5/1:2 (ст. 72 ч. 3.2).',
};

export function TimelineStage() {
  const subject = useCaseStore((s) => s.caseFile.subject);
  const episodes = useCaseStore((s) => s.caseFile.episodes);
  const convictions = useCaseStore((s) => s.caseFile.convictions);
  const trialDate = useCaseStore((s) => s.caseFile.context.trialDate);
  const addEpisode = useCaseStore((s) => s.addEpisode);
  const addConviction = useCaseStore((s) => s.addConviction);
  const articles = useArticlesStore((s) => s.index());

  const referenceDate = trialDate ?? new Date().toISOString().slice(0, 10);

  // Нормализуем приговоры (auto-worstCategory из composition[]) перед детекторами.
  const enriched = useMemo(
    () => enrichConvictions(convictions, articles),
    [convictions, articles],
  );

  // Активные (непогашённые) судимости на дату текущего приговора.
  const activeConvictions = useMemo(
    () => activeConvictionsAt(enriched, referenceDate),
    [enriched, referenceDate],
  );

  // Самый тяжёлый эпизод определяет категорию для расчёта рецидива.
  const worstEpisodeCategory: CrimeCategory = useMemo(() => {
    if (episodes.length === 0) return CrimeCategory.Small;
    const order: CrimeCategory[] = [
      CrimeCategory.Small,
      CrimeCategory.Medium,
      CrimeCategory.Heavy,
      CrimeCategory.EspeciallyHeavy,
    ];
    return episodes.reduce<CrimeCategory>((acc, e) => {
      const cat =
        e.effectiveCategory ??
        findArticlePart(articles, e.articleNumber, e.articlePart)?.category ??
        CrimeCategory.Small;
      return order.indexOf(cat) > order.indexOf(acc) ? cat : acc;
    }, CrimeCategory.Small);
  }, [episodes, articles]);

  const recidivism = useMemo(
    () => recidivismKindFor(subject, worstEpisodeCategory, activeConvictions),
    [subject, worstEpisodeCategory, activeConvictions],
  );

  const conflicts = useMemo(
    () => detectTimelineConflicts(episodes, convictions),
    [episodes, convictions],
  );

  return (
    <div className={styles.row}>
      {/* ─── Левая колонка: списки ─────────────────────────────────────── */}
      <div className={styles.stack}>
        <Card
          title="Эпизоды (Этап 2)"
          description="Вменяемые преступления текущего дела. Категория и санкция автоматически подтянутся из реестра при выборе статьи."
        >
          <div className={styles.list}>
            {episodes.length === 0 && (
              <div className={styles.empty}>
                Эпизодов пока нет. Добавьте первый — без него движок не запустится.
              </div>
            )}
            {episodes.map((e, i) => (
              <EpisodeCard key={e.id} episode={e} index={i} />
            ))}
            <button className={styles.addBtn} onClick={() => addEpisode()}>
              + Добавить эпизод
            </button>
          </div>
        </Card>

        <Card
          title="Прошлые приговоры"
          description="Все приговоры, имеющие правовое значение для текущего дела (рецидив, ст. 69 ч. 5, ст. 70). Дата = вступление в силу. Период УДО НЕ включается в фактически отбытый срок."
        >
          <div className={styles.list}>
            {convictions.length === 0 && (
              <div className={styles.empty}>
                Прошлых приговоров нет — рецидив не образуется, ст. 70 не применяется.
              </div>
            )}
            {convictions.map((c, i) => (
              <ConvictionCard key={c.id} conviction={c} index={i} />
            ))}
            <button className={styles.addBtn} onClick={() => addConviction()}>
              + Добавить приговор
            </button>
          </div>
        </Card>
      </div>

      {/* ─── Правый рейл: рецидив + конфликты ──────────────────────────── */}
      <div className={styles.rail}>
        <Card title="Рецидив (ст. 18)" description="T-018 — пересчитывается на лету.">
          <div
            className={`${styles.recidivismBadge} ${recidivismClass(recidivism)}`}
          >
            <span className={styles.recidivismKindLabel}>
              {RECIDIVISM_LABEL[recidivism]}
            </span>
            {RECIDIVISM_DESCRIPTION[recidivism]}
          </div>
          <p
            style={{
              marginTop: 10,
              fontSize: 12,
              color: 'var(--text-tertiary)',
              lineHeight: 1.45,
            }}
          >
            Учтены непогашённые судимости на {referenceDate}: {activeConvictions.length}
            {convictions.length > activeConvictions.length
              ? ` из ${convictions.length}`
              : ''}
            . Категория самого тяжкого эпизода: {worstEpisodeCategory}.
          </p>
        </Card>

        <Card
          title="Конфликты"
          description="Детекторы T-069-5 и T-070 — связь эпизодов с приговорами."
          tone={conflicts.length > 0 ? 'warn' : 'default'}
        >
          {conflicts.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
              Конфликтов не обнаружено.
            </p>
          ) : (
            <div className={styles.list}>
              {conflicts.map((c, i) => (
                <div
                  key={`${c.ruleId}-${c.episodeId}-${c.convictionId}-${i}`}
                  className={styles.conflictItem}
                >
                  <span className={styles.conflictRule}>{c.ruleId}</span>
                  <span className={styles.conflictMessage}>{c.message}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function recidivismClass(kind: RecidivismKind): string {
  switch (kind) {
    case RecidivismKind.Simple:
      return styles.recidivismBadgeSimple ?? '';
    case RecidivismKind.Dangerous:
      return styles.recidivismBadgeDangerous ?? '';
    case RecidivismKind.EspeciallyDangerous:
      return styles.recidivismBadgeEspecially ?? '';
    default:
      return styles.recidivismBadgeNone ?? '';
  }
}

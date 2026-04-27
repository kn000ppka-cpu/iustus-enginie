import { useCallback } from 'react';

import { useCaseStore } from '@state/case-store';
import { STAGE_LABELS, STAGE_ORDER, StageId } from '@domain/enums';
import { detectTelegram, tgConfirm } from '@telegram/webapp';
import {
  useTelegramBackButton,
  useTelegramMainButton,
} from '@telegram/useTelegram';
import styles from './styles/layout.module.css';

import { SubjectStage } from './stages/SubjectStage';
import { TimelineStage } from './stages/TimelineStage';
import { ContextStage } from './stages/ContextStage';
import { EngineStage } from './stages/EngineStage';
import { PolishStage } from './stages/PolishStage';
import { OutputStage } from './stages/OutputStage';

export function App() {
  const { currentStage, setStage, resetCase } = useCaseStore();
  const currentIndex = STAGE_ORDER.indexOf(currentStage);
  const inTelegram = detectTelegram();

  const goNext = useCallback(() => {
    if (currentIndex < STAGE_ORDER.length - 1) {
      setStage(STAGE_ORDER[currentIndex + 1]!);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentIndex, setStage]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setStage(STAGE_ORDER[currentIndex - 1]!);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentIndex, setStage]);

  // ── Нативная Telegram-кнопка «Далее» в нижней части экрана ───────────
  // Скрываем на последнем этапе (Output) — там OutputStage сам ставит
  // свою MainButton «Экспорт PDF».
  useTelegramMainButton({
    text: currentIndex === STAGE_ORDER.length - 1 ? '' : 'Далее →',
    onClick: goNext,
    hidden: currentIndex === STAGE_ORDER.length - 1,
  });

  // ── Нативная Telegram BackButton в шапке ─────────────────────────────
  useTelegramBackButton({
    onClick: currentIndex > 0 ? goPrev : undefined,
  });

  const handleReset = async () => {
    const ok = await tgConfirm(
      'Сбросить текущий кейс? Все данные этого расчёта будут удалены.',
    );
    if (ok) resetCase();
  };

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div>
          <span className={styles.title}>Iustus Engine</span>
          <span className={styles.subtitle}>
            расчёт уголовного наказания · УК РФ · ППВС № 58/2015
          </span>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.navButton} onClick={handleReset}>
            Новый кейс
          </button>
        </div>
      </header>

      <nav className={styles.stages}>
        {STAGE_ORDER.map((s, i) => (
          <button
            key={s}
            onClick={() => setStage(s)}
            className={`${styles.stage} ${s === currentStage ? styles.stageActive : ''}`}
          >
            <span className={styles.stageNumber}>{i + 1}</span>
            <span>{STAGE_LABELS[s]}</span>
          </button>
        ))}
      </nav>

      <main className={styles.body}>
        <div className={styles.content}>{renderStage(currentStage)}</div>
      </main>

      {/* Нижний footer-навигатор. В Telegram-mobile прячем — там Telegram
          MainButton выполняет ту же функцию (см. telegram.css). */}
      <footer
        className={styles.footer}
        data-tg-hide-on-mobile={inTelegram ? 'true' : undefined}
      >
        <button
          className={styles.navButton}
          onClick={goPrev}
          disabled={currentIndex === 0}
        >
          ← Назад
        </button>
        <span className={styles.counter}>
          {currentIndex + 1} / {STAGE_ORDER.length}
        </span>
        <button
          className={`${styles.navButton} ${styles.navButtonPrimary}`}
          onClick={goNext}
          disabled={currentIndex === STAGE_ORDER.length - 1}
        >
          Далее →
        </button>
      </footer>
    </div>
  );
}

function renderStage(stage: StageId) {
  switch (stage) {
    case StageId.Subject:
      return <SubjectStage />;
    case StageId.Timeline:
      return <TimelineStage />;
    case StageId.Context:
      return <ContextStage />;
    case StageId.Engine:
      return <EngineStage />;
    case StageId.Polish:
      return <PolishStage />;
    case StageId.Output:
      return <OutputStage />;
    default:
      return null;
  }
}

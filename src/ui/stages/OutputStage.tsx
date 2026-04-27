/**
 * Этап 6. Финал.
 *
 * Сверху — KPI с финалом по делу. Ниже — УДО / замена. Затем preview
 * приговора по структуре ППВС № 55/2016 и кнопка экспорта в PDF.
 * В самом низу — полный «Путь машины» (этапы 4 + 5).
 *
 * Поддерживает РУЧНОЕ РЕДАКТИРОВАНИЕ текста приговора:
 *   • Кнопка «Редактировать вручную» переводит preview в режим textarea
 *     по секциям (шапка / установочная / резолютивная / освобождение).
 *   • Пока активен ручной режим — авто-обновления текста при изменениях
 *     приостановлены (но KPI и Путь машины продолжают пересчитываться).
 *   • «Сбросить к авто-генерации» возвращает текст из движка.
 *   • Экспорт в PDF использует именно отредактированную версию.
 */

import { useCallback, useMemo, useState } from 'react';
import { useArticlesStore } from '@state/articles-store';
import { useCaseStore } from '@state/case-store';
import { runEngine, formatDays } from '@engine/index';
import { runPolish } from '@engine/polish/index';
import { evaluateParole, evaluateReplace } from '@engine/release/index';
import { FACILITY_LABELS, PunishmentKind } from '@domain/enums';
import { buildVerdict, type VerdictDoc } from '@export/buildVerdict';
import { detectTelegram, openExternalLink, tgAlert } from '@telegram/webapp';
import { useTelegramMainButton } from '@telegram/useTelegram';

import { Card } from '../components/Card';
import styles from './output.module.css';

interface VerdictDraft {
  heading: string;
  findings: string;
  resolution: string;
  releaseInfo: string;
}

const splitLines = (s: string): string[] =>
  s.split('\n').map((l) => l.trimEnd()).filter((l, i, arr) => {
    // Сохраняем пустые строки внутри блока, но обрезаем в конце.
    if (l !== '') return true;
    return i < arr.length - 1;
  });

const verdictToDraft = (v: VerdictDoc): VerdictDraft => ({
  heading: v.heading.join('\n'),
  findings: v.findings.join('\n'),
  resolution: v.resolution.join('\n'),
  releaseInfo: v.releaseInfo.join('\n'),
});

export function OutputStage() {
  const caseFile = useCaseStore((s) => s.caseFile);
  const articles = useArticlesStore((s) => s.index());
  const [exporting, setExporting] = useState(false);

  // Ручное редактирование текста приговора.
  const [draft, setDraft] = useState<VerdictDraft | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const polishResult = useMemo(() => {
    const base = runEngine(caseFile, articles);
    return runPolish(base, caseFile, articles);
  }, [caseFile, articles]);

  const isLifeImpr = polishResult.episodes.some(
    (e) => e.punishmentKind === PunishmentKind.LifeImprisonment,
  );

  const parole = useMemo(
    () =>
      evaluateParole({
        finalRangeAfterZachet: polishResult.finalRangeAfterZachet,
        servingStartDate: caseFile.context.trialDate,
        episodes: caseFile.episodes,
        articles,
        recidivism: polishResult.recidivism,
        ...(isLifeImpr ? { isLifeImprisonment: true } : {}),
      }),
    [polishResult, caseFile, articles, isLifeImpr],
  );

  const replace = useMemo(
    () =>
      evaluateReplace({
        finalRangeAfterZachet: polishResult.finalRangeAfterZachet,
        servingStartDate: caseFile.context.trialDate,
        episodes: caseFile.episodes,
        articles,
        recidivism: polishResult.recidivism,
        ...(isLifeImpr ? { isLifeImprisonment: true } : {}),
      }),
    [polishResult, caseFile, articles, isLifeImpr],
  );

  const autoVerdict = useMemo(
    () => buildVerdict({ caseFile, articles, result: polishResult, parole }),
    [caseFile, articles, polishResult, parole],
  );

  // Эффективный приговор для preview / PDF: ручная версия, если есть.
  const effectiveVerdict: VerdictDoc = useMemo(() => {
    if (!draft) return autoVerdict;
    return {
      heading: splitLines(draft.heading),
      findings: splitLines(draft.findings),
      resolution: splitLines(draft.resolution),
      releaseInfo: splitLines(draft.releaseInfo),
      // Путь машины всегда берём из движка — это технический аудит-лог,
      // редактировать его смысла нет.
      enginePath: autoVerdict.enginePath,
    };
  }, [autoVerdict, draft]);

  const handleStartEdit = () => {
    setDraft(verdictToDraft(autoVerdict));
    setIsEditing(true);
  };

  const handleFinishEdit = () => {
    setIsEditing(false);
  };

  const handleResetEdit = () => {
    if (
      draft &&
      !window.confirm(
        'Сбросить все ручные правки и вернуться к авто-сгенерированному тексту?',
      )
    ) {
      return;
    }
    setDraft(null);
    setIsEditing(false);
  };

  const handleReloadFromEngine = () => {
    if (
      !window.confirm(
        'Перезагрузить текст из движка? Все ручные правки будут заменены свежими данными.',
      )
    ) {
      return;
    }
    setDraft(verdictToDraft(autoVerdict));
  };

  const updateDraft = (patch: Partial<VerdictDraft>) => {
    setDraft((d) => (d ? { ...d, ...patch } : d));
  };

  const inTelegram = detectTelegram();

  const handleExport = useCallback(async () => {
    if (caseFile.episodes.length === 0) return;
    setExporting(true);
    try {
      // Lazy-import: pdfmake (со шрифтами ≈ 2 MB) грузится только при первом
      // клике на экспорт — основной бандл остаётся компактным.
      const { exportVerdictPdf, getVerdictPdfBlob, getVerdictPdfBlobUrl } =
        await import('@export/exportPdf');
      const fileName = `verdict_${(caseFile.subject.fullName || 'case').replace(/\s+/g, '_')}_${
        caseFile.context.trialDate ?? 'draft'
      }.pdf`;

      // Не-Telegram: обычный browser download через pdfmake.
      if (!inTelegram) {
        exportVerdictPdf(effectiveVerdict, fileName);
        return;
      }

      // Telegram-режим. Многослойная стратегия:
      //   1. Web Share API с File — нативная iOS/Android-шторка «Поделиться».
      //      Самый надёжный путь на телефоне: пользователь сохранит в Files,
      //      Google Drive, отправит в чат и т. п.
      //   2. Открытие blob URL во внешнем браузере (для Telegram Desktop).
      //   3. Fallback: прямой download (Telegram Web на ПК).
      const blob = await getVerdictPdfBlob(effectiveVerdict);
      const file = new File([blob], fileName, { type: 'application/pdf' });

      // 1) Web Share API
      const nav = navigator as Navigator & {
        canShare?: (data: { files: File[] }) => boolean;
        share?: (data: { files: File[]; title?: string }) => Promise<void>;
      };
      if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
        try {
          await nav.share({ files: [file], title: 'Приговор (Iustus Engine)' });
          return;
        } catch (err) {
          // Пользователь отменил share-диалог — это норма, выходим без alert.
          if ((err as Error)?.name === 'AbortError') return;
          // Иначе — падаем на следующий способ.
        }
      }

      // 2) Открыть в системном браузере через openLink
      try {
        const url = await getVerdictPdfBlobUrl(effectiveVerdict);
        openExternalLink(url);
        await tgAlert(
          'PDF открыт во внешнем браузере. Нажмите «Поделиться» / «Сохранить», ' +
            'чтобы сохранить файл на устройство.',
        );
        return;
      } catch {
        // 3) Последний шанс — прямой download
        exportVerdictPdf(effectiveVerdict, fileName);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[exportPdf] failed', err);
      await tgAlert(
        'Не удалось создать PDF. Попробуйте открыть приложение в Telegram на ПК ' +
          'или в браузере вместо мобильного клиента.',
      );
    } finally {
      setTimeout(() => setExporting(false), 300);
    }
  }, [caseFile, effectiveVerdict, inTelegram]);

  const noEpisodes = caseFile.episodes.length === 0;
  const hasManualEdits = draft !== null;

  // Telegram MainButton: единая нативная кнопка экспорта PDF в нижней
  // части экрана. Вне Telegram — no-op.
  useTelegramMainButton({
    text: noEpisodes
      ? ''
      : exporting
        ? 'Создание PDF…'
        : isEditing
          ? 'Завершите редактирование'
          : '⬇ Сохранить приговор в PDF',
    onClick: handleExport,
    disabled: noEpisodes || exporting || isEditing,
    loading: exporting,
    hidden: noEpisodes,
  });

  return (
    <div className={styles.stack}>
      <Card
        title="Финал по делу (Этап 6)"
        description="Сводка после всех этапов. Все цифры — пересчитываются вживую при изменении любого поля."
      >
        {noEpisodes ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
            Эпизодов нет. Добавьте их на Этапе 2 — без эпизодов финал не формируется.
          </p>
        ) : (
          <div className={styles.kpiRow}>
            <div className={`${styles.kpi} ${styles.kpiAccent}`}>
              <span className={styles.kpiLabel}>Окончательное наказание</span>
              <span className={styles.kpiValue}>
                от {formatDays(polishResult.finalRange.min)} до{' '}
                {formatDays(polishResult.finalRange.max)}
              </span>
              <span className={styles.kpiNote}>До зачёта по ст. 72.</span>
            </div>

            <div className={`${styles.kpi} ${styles.kpiAccent}`}>
              <span className={styles.kpiLabel}>К отбытию</span>
              <span className={styles.kpiValue}>
                от {formatDays(polishResult.finalRangeAfterZachet.min)} до{' '}
                {formatDays(polishResult.finalRangeAfterZachet.max)}
              </span>
              <span className={styles.kpiNote}>
                Зачёт ст. 72: {formatDays(polishResult.totalCreditDays)}.
              </span>
            </div>

            <div className={styles.kpi}>
              <span className={styles.kpiLabel}>Режим (ст. 58)</span>
              <span className={styles.kpiValue}>
                {polishResult.facility ? FACILITY_LABELS[polishResult.facility] : '—'}
              </span>
            </div>

            <div className={styles.kpi}>
              <span className={styles.kpiLabel}>УО (ст. 73)</span>
              <span className={styles.kpiValue}>
                {polishResult.conditional.available ? 'Допустимо' : 'Не применяется'}
              </span>
              <span className={styles.kpiNote}>{polishResult.conditional.reason}</span>
            </div>
          </div>
        )}
      </Card>

      <Card
        title="Освобождение"
        description="УДО (ст. 79) и замена неотбытой части более мягким видом (ст. 80) — расчёт по долям отбытого срока."
      >
        <div className={styles.kpiRow}>
          <div className={styles.kpi}>
            <span className={styles.kpiLabel}>УДО — после</span>
            <span className={styles.kpiValue}>
              {formatDays(parole.daysServedRequired)}
            </span>
            <span className={styles.kpiNote}>
              {parole.reason}
              {parole.earliestDate && (
                <>
                  <br />
                  Ранее: <strong>{parole.earliestDate}</strong> (отсчёт от даты приговора).
                </>
              )}
            </span>
          </div>

          <div className={styles.kpi}>
            <span className={styles.kpiLabel}>Замена ст. 80 — после</span>
            <span className={styles.kpiValue}>
              {formatDays(replace.daysServedRequired)}
            </span>
            <span className={styles.kpiNote}>{replace.reason}</span>
          </div>
        </div>
      </Card>

      <Card
        title="Приговор (preview)"
        description="Структура по ППВС № 55/2016 пп. 26-31. PDF сохраняет весь текст + приложение «Путь машины». Можно редактировать вручную: правки войдут в PDF."
      >
        <div className={styles.stack}>
          {/* ── Панель управления редактированием ────────────────────── */}
          <div className={styles.editToolbar}>
            <span
              className={`${styles.editStatus} ${
                hasManualEdits ? styles.editStatusActive : ''
              }`}
            >
              {isEditing
                ? '✏️ Режим редактирования. Изменяйте текст в полях ниже.'
                : hasManualEdits
                  ? '✓ Текст приговора отредактирован вручную. Авто-обновления приостановлены.'
                  : 'Текст генерируется автоматически из данных дела.'}
            </span>

            {!isEditing && !hasManualEdits && (
              <button
                className={styles.editBtn}
                onClick={handleStartEdit}
                disabled={noEpisodes}
              >
                ✏️ Редактировать вручную
              </button>
            )}

            {!isEditing && hasManualEdits && (
              <>
                <button
                  className={styles.editBtn}
                  onClick={handleStartEdit}
                >
                  ✏️ Продолжить редактирование
                </button>
                <button
                  className={styles.editBtn}
                  onClick={handleReloadFromEngine}
                  title="Заменить текущий текст свежими данными из движка (правки потеряются)"
                >
                  🔄 Обновить из движка
                </button>
                <button
                  className={`${styles.editBtn} ${styles.editBtnDanger}`}
                  onClick={handleResetEdit}
                >
                  Сбросить к авто
                </button>
              </>
            )}

            {isEditing && (
              <>
                <button
                  className={`${styles.editBtn} ${styles.editBtnPrimary}`}
                  onClick={handleFinishEdit}
                >
                  ✓ Готово
                </button>
                <button
                  className={`${styles.editBtn} ${styles.editBtnDanger}`}
                  onClick={handleResetEdit}
                >
                  Отмена и сброс
                </button>
              </>
            )}
          </div>

          {/* ── Сам preview / редактор ───────────────────────────────── */}
          {isEditing && draft ? (
            <div className={styles.preview}>
              <div className={styles.previewTitle}>Шапка</div>
              <div className={styles.editHint}>
                Каждая строка — отдельный абзац. Пустые строки сохраняются.
              </div>
              <textarea
                className={styles.editTextarea}
                value={draft.heading}
                onChange={(e) => updateDraft({ heading: e.target.value })}
                rows={Math.max(4, draft.heading.split('\n').length + 1)}
              />

              <div className={styles.previewTitle}>Установочная часть</div>
              <textarea
                className={styles.editTextarea}
                value={draft.findings}
                onChange={(e) => updateDraft({ findings: e.target.value })}
                rows={Math.max(4, draft.findings.split('\n').length + 1)}
              />

              <div className={styles.previewTitle}>Резолютивная часть</div>
              <textarea
                className={styles.editTextarea}
                value={draft.resolution}
                onChange={(e) => updateDraft({ resolution: e.target.value })}
                rows={Math.max(6, draft.resolution.split('\n').length + 1)}
              />

              <div className={styles.previewTitle}>Освобождение</div>
              <textarea
                className={styles.editTextarea}
                value={draft.releaseInfo}
                onChange={(e) => updateDraft({ releaseInfo: e.target.value })}
                rows={Math.max(3, draft.releaseInfo.split('\n').length + 1)}
              />
            </div>
          ) : (
            <div className={styles.preview}>
              {effectiveVerdict.heading.map((line, i) => (
                <div key={`h-${i}`} className={styles.previewLine}>{line}</div>
              ))}
              <div className={styles.previewTitle}>Установочная часть</div>
              <div className={styles.previewBody}>
                {effectiveVerdict.findings.map((f, i) => (
                  <div key={`f-${i}`} className={styles.previewLine}>{f}</div>
                ))}
              </div>
              <div className={styles.previewTitle}>Резолютивная часть</div>
              <div className={styles.previewBody}>
                {effectiveVerdict.resolution.map((r, i) => (
                  <div key={`r-${i}`} className={styles.previewLine}>{r}</div>
                ))}
              </div>
              <div className={styles.previewTitle}>Освобождение</div>
              <div className={styles.previewBody}>
                {effectiveVerdict.releaseInfo.map((r, i) => (
                  <div key={`rel-${i}`} className={styles.previewLine}>{r}</div>
                ))}
              </div>
            </div>
          )}

          <button
            className={styles.exportBtn}
            onClick={handleExport}
            disabled={noEpisodes || exporting || isEditing}
            title={
              isEditing
                ? 'Завершите редактирование (кнопка «Готово»), затем экспортируйте.'
                : undefined
            }
          >
            {exporting ? '⏳ Создание PDF…' : '⬇ Экспорт приговора в PDF'}
          </button>
        </div>
      </Card>

      <Card
        title="Путь машины"
        description={`${effectiveVerdict.enginePath.length} применённых правил с ссылками на нормы и источники (ППВС). Это и есть аудит-лог.`}
      >
        {effectiveVerdict.enginePath.length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
            Никаких коэффициентов не применялось — санкция взята как есть.
          </p>
        ) : (
          <div>
            {effectiveVerdict.enginePath.map((p, i) => (
              <div key={`p-${i}`} className={styles.pathItem}>
                <span className={styles.pathRule}>{p.ruleId}</span>
                <span className={styles.pathDesc}>
                  {p.description}
                  <span className={styles.pathSource}>
                    {p.norm}
                    {p.source ? ` · ${p.source}` : ''}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

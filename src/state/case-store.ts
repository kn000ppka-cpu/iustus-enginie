/**
 * Хранилище текущего кейса (CaseFile) на Zustand + Immer.
 *
 * Принципы:
 *   - Один кейс «в работе» одновременно; персистентность — localStorage.
 *   - Все изменения — через типизированные actions, никакого прямого мутирования.
 *   - Производные значения (вид рецидива, заблокированные виды наказания, итог
 *     расчёта) НЕ хранятся, а вычисляются движком через селекторы.
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';

import type {
  CaseContext,
  CaseFile,
  Conviction,
  DetentionPeriod,
  Episode,
  EpisodeFlags,
  EntityId,
  PolishConfig,
  Subject,
} from '@domain/types';
import { DisabilityGroup, Gender, StageId } from '@domain/enums';

// ────────────────────────────────────────────────────────────────────────────
// Утилиты
// ────────────────────────────────────────────────────────────────────────────

const newId = (): EntityId =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const todayIso = (): string => new Date().toISOString().slice(0, 10);

// ────────────────────────────────────────────────────────────────────────────
// Фабрика пустого кейса
// ────────────────────────────────────────────────────────────────────────────

const emptySubject = (): Subject => ({
  gender: Gender.Male,
  birthDate: '1990-01-01',
  isPregnant: false,
  hasChildUnder3: false,
  hasChildUnder14: false,
  disability: DisabilityGroup.None,
  isMilitary: false,
  hasStateAwards: false,
});

const emptyContext = (): CaseContext => ({
  preTrialAgreement: false,
  specialProcedure: false,
  juryTrial: false,
  trialDate: todayIso(),
});

const emptyPolish = (): PolishConfig => ({
  detentionPeriods: [],
  applyConditional: false,
});

const emptyEpisodeFlags = (): EpisodeFlags => ({
  mitigatingIds: [],
  aggravatingIds: [],
  art62_1: false,
  art64: false,
  art65: false,
  art15_6_applied: false,
});

export const createEmptyCase = (): CaseFile => ({
  id: newId(),
  createdAt: todayIso(),
  updatedAt: todayIso(),
  subject: emptySubject(),
  episodes: [],
  convictions: [],
  context: emptyContext(),
  polish: emptyPolish(),
});

// ────────────────────────────────────────────────────────────────────────────
// Store
// ────────────────────────────────────────────────────────────────────────────

interface CaseStore {
  caseFile: CaseFile;
  currentStage: StageId;

  // Навигация
  setStage: (stage: StageId) => void;

  // Этап 1
  updateSubject: (patch: Partial<Subject>) => void;

  // Этап 2 — эпизоды
  addEpisode: () => EntityId;
  updateEpisode: (id: EntityId, patch: Partial<Episode>) => void;
  updateEpisodeFlags: (id: EntityId, patch: Partial<EpisodeFlags>) => void;
  removeEpisode: (id: EntityId) => void;

  // Этап 2 — приговоры
  addConviction: () => EntityId;
  updateConviction: (id: EntityId, patch: Partial<Conviction>) => void;
  removeConviction: (id: EntityId) => void;

  // Этап 3
  updateContext: (patch: Partial<CaseContext>) => void;

  // Этап 5 — зачёт
  addDetentionPeriod: () => EntityId;
  updateDetentionPeriod: (id: EntityId, patch: Partial<DetentionPeriod>) => void;
  removeDetentionPeriod: (id: EntityId) => void;
  updatePolish: (patch: Partial<PolishConfig>) => void;

  // Сброс
  resetCase: () => void;
}

export const useCaseStore = create<CaseStore>()(
  persist(
    immer((set) => ({
      caseFile: createEmptyCase(),
      currentStage: StageId.Subject,

      setStage: (stage) =>
        set((state) => {
          state.currentStage = stage;
        }),

      updateSubject: (patch) =>
        set((state) => {
          Object.assign(state.caseFile.subject, patch);
          state.caseFile.updatedAt = todayIso();
        }),

      addEpisode: () => {
        const id = newId();
        set((state) => {
          state.caseFile.episodes.push({
            id,
            commitDate: todayIso(),
            articleNumber: '',
            articlePart: '1',
            stage: 'completed',
            role: 'solo',
            flags: emptyEpisodeFlags(),
          });
          state.caseFile.updatedAt = todayIso();
        });
        return id;
      },

      updateEpisode: (id, patch) =>
        set((state) => {
          const ep = state.caseFile.episodes.find((e) => e.id === id);
          if (ep) Object.assign(ep, patch);
          state.caseFile.updatedAt = todayIso();
        }),

      updateEpisodeFlags: (id, patch) =>
        set((state) => {
          const ep = state.caseFile.episodes.find((e) => e.id === id);
          if (ep) Object.assign(ep.flags, patch);
          state.caseFile.updatedAt = todayIso();
        }),

      removeEpisode: (id) =>
        set((state) => {
          state.caseFile.episodes = state.caseFile.episodes.filter((e) => e.id !== id);
          state.caseFile.updatedAt = todayIso();
        }),

      addConviction: () => {
        const id = newId();
        set((state) => {
          state.caseFile.convictions.push({
            id,
            effectiveDate: todayIso(),
            // Одна пустая запись, чтобы UI сразу показывал picker; пользователь
            // может добавить ещё («приговор по совокупности») или удалить.
            composition: [{ article: '', part: '1' }],
            sentence: {
              kind: 'imprisonment',
              duration: { years: 0, months: 0, days: 0 },
            },
            status: 'served',
          });
          state.caseFile.updatedAt = todayIso();
        });
        return id;
      },

      updateConviction: (id, patch) =>
        set((state) => {
          const c = state.caseFile.convictions.find((x) => x.id === id);
          if (c) Object.assign(c, patch);
          state.caseFile.updatedAt = todayIso();
        }),

      removeConviction: (id) =>
        set((state) => {
          state.caseFile.convictions = state.caseFile.convictions.filter((c) => c.id !== id);
          state.caseFile.updatedAt = todayIso();
        }),

      updateContext: (patch) =>
        set((state) => {
          Object.assign(state.caseFile.context, patch);
          state.caseFile.updatedAt = todayIso();
        }),

      addDetentionPeriod: () => {
        const id = newId();
        set((state) => {
          state.caseFile.polish.detentionPeriods.push({
            id,
            regime: 'custody',
            from: todayIso(),
            to: todayIso(),
          });
          state.caseFile.updatedAt = todayIso();
        });
        return id;
      },

      updateDetentionPeriod: (id, patch) =>
        set((state) => {
          const p = state.caseFile.polish.detentionPeriods.find((x) => x.id === id);
          if (p) Object.assign(p, patch);
          state.caseFile.updatedAt = todayIso();
        }),

      removeDetentionPeriod: (id) =>
        set((state) => {
          state.caseFile.polish.detentionPeriods = state.caseFile.polish.detentionPeriods.filter(
            (p) => p.id !== id,
          );
          state.caseFile.updatedAt = todayIso();
        }),

      updatePolish: (patch) =>
        set((state) => {
          Object.assign(state.caseFile.polish, patch);
          state.caseFile.updatedAt = todayIso();
        }),

      resetCase: () =>
        set((state) => {
          state.caseFile = createEmptyCase();
          state.currentStage = StageId.Subject;
        }),
    })),
    {
      name: 'iustus-engine:case',
      version: 1,
    },
  ),
);

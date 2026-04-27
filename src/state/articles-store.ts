/**
 * Хранилище пользовательских статей УК.
 *
 * Отделено от `case-store` намеренно: пользовательские статьи переживают
 * множество кейсов и должны сохраняться независимо от текущего расчёта.
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';

import type { UkArticle } from '@domain/types';
import { buildArticleIndex } from '@legal/articles/registry';

interface ArticlesStore {
  /** Только пользовательские статьи. Seed подмешивается через `index()`. */
  userArticles: UkArticle[];

  /** Полный отсортированный индекс seed + user (мемоизировать на стороне UI). */
  index: () => UkArticle[];

  upsertUserArticle: (article: UkArticle) => void;
  removeUserArticle: (number: string) => void;
  resetUserArticles: () => void;
}

export const useArticlesStore = create<ArticlesStore>()(
  persist(
    immer((set, get) => ({
      userArticles: [],

      index: () => buildArticleIndex(get().userArticles),

      upsertUserArticle: (article) =>
        set((state) => {
          const i = state.userArticles.findIndex((a) => a.number === article.number);
          if (i >= 0) state.userArticles[i] = { ...article, source: 'user' };
          else state.userArticles.push({ ...article, source: 'user' });
        }),

      removeUserArticle: (number) =>
        set((state) => {
          state.userArticles = state.userArticles.filter((a) => a.number !== number);
        }),

      resetUserArticles: () =>
        set((state) => {
          state.userArticles = [];
        }),
    })),
    {
      name: 'iustus-engine:user-articles',
      version: 1,
    },
  ),
);

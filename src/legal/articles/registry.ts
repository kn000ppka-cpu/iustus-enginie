/**
 * Реестр статей УК.
 *
 * Объединяет встроенный seed (`SEED_ARTICLES`) и пользовательские статьи,
 * добавленные через UI. Предоставляет lookup по номеру/части и поиск
 * по подстроке для UI-комбобокса.
 *
 * Источник пользовательских статей передаётся явно — это снимает зависимость
 * от Zustand-стора (важно для тестов и для повторного использования движком).
 */

import type { ArticlePart, UkArticle } from '@domain/types';
import { SEED_ARTICLES } from './seed';

/**
 * Сборка списка всех статей: встроенные + пользовательские.
 * Если у пользовательской статьи тот же номер, что у seed, — приоритет seed,
 * чтобы случайное переопределение не подменяло проверенные санкции.
 */
export function buildArticleIndex(userArticles: UkArticle[] = []): UkArticle[] {
  const seenNumbers = new Set(SEED_ARTICLES.map((a) => a.number));
  const filtered = userArticles.filter((u) => !seenNumbers.has(u.number));
  return [...SEED_ARTICLES, ...filtered].sort((a, b) =>
    compareArticleNumbers(a.number, b.number),
  );
}

/** Сравнение номеров статей с учётом дробных частей: '228' < '228.1' < '229'. */
export function compareArticleNumbers(a: string, b: string): number {
  const [aMain, aSub = '0'] = a.split('.');
  const [bMain, bSub = '0'] = b.split('.');
  const aMainN = Number(aMain);
  const bMainN = Number(bMain);
  if (aMainN !== bMainN) return aMainN - bMainN;
  return Number(aSub) - Number(bSub);
}

export function findArticle(
  index: UkArticle[],
  number: string,
): UkArticle | undefined {
  return index.find((a) => a.number === number);
}

export function findArticlePart(
  index: UkArticle[],
  number: string,
  part: string,
): ArticlePart | undefined {
  return findArticle(index, number)?.parts.find((p) => p.part === part);
}

/**
 * Поиск по подстроке номера статьи или названия (без учёта регистра).
 * Используется в UI-комбобоксе на Этапе 2.
 */
export function searchArticles(index: UkArticle[], query: string): UkArticle[] {
  const q = query.trim().toLowerCase();
  if (!q) return index;
  return index.filter(
    (a) =>
      a.number.startsWith(q) ||
      a.title.toLowerCase().includes(q) ||
      (a.chapter ?? '').toLowerCase().includes(q),
  );
}

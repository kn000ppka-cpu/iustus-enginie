/**
 * Нормализация прошлых приговоров: автозаполнение `worstCategory` по составу.
 *
 * Прошлый приговор может быть постановлен по совокупности нескольких статей
 * (`composition: ArticleRef[]`). Для расчёта рецидива (T-018), погашения
 * (T-086) и режима (P-058-*) нам нужна категория самого тяжкого состава
 * приговора. Если пользователь явно указал `worstCategory` — он имеет
 * приоритет. Иначе — выводим из реестра по `composition`.
 *
 * Использовать в `runEngine` и в `TimelineStage` ДО передачи приговоров в
 * детекторы, чтобы все правила работали с одинаково нормализованными данными.
 */

import { CrimeCategory } from '@domain/enums';
import type { Conviction, UkArticle } from '@domain/types';
import { findArticlePart } from '@legal/articles/registry';

const CATEGORY_ORDER: CrimeCategory[] = [
  CrimeCategory.Small,
  CrimeCategory.Medium,
  CrimeCategory.Heavy,
  CrimeCategory.EspeciallyHeavy,
];

/** Худшая категория из массива составов; undefined если не нашли ни одной статьи. */
export function autoWorstCategory(
  composition: { article: string; part: string }[],
  articles: UkArticle[],
): CrimeCategory | undefined {
  let worst: CrimeCategory | undefined;
  for (const comp of composition) {
    const part = findArticlePart(articles, comp.article, comp.part);
    if (!part) continue;
    if (
      !worst ||
      CATEGORY_ORDER.indexOf(part.category) > CATEGORY_ORDER.indexOf(worst)
    ) {
      worst = part.category;
    }
  }
  return worst;
}

/** Возвращает копии приговоров с заполненным `worstCategory`. */
export function enrichConvictions(
  convictions: Conviction[],
  articles: UkArticle[],
): Conviction[] {
  return convictions.map((c) => {
    if (c.worstCategory) return c;
    const auto = autoWorstCategory(c.composition, articles);
    return auto ? { ...c, worstCategory: auto } : c;
  });
}

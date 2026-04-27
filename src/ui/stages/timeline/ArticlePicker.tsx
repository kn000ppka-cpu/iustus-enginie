/**
 * Комбобокс «Статья + часть».
 *
 * Источник статей — `useArticlesStore.index()` (seed + пользовательские).
 * Поиск идёт по подстроке номера и названию. После выбора статьи показывается
 * select для номера части.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useArticlesStore } from '@state/articles-store';
import { searchArticles } from '@legal/articles/registry';
import styles from './ArticlePicker.module.css';

interface ArticlePickerProps {
  articleNumber: string;
  articlePart: string;
  onChange: (number: string, part: string) => void;
}

export function ArticlePicker({
  articleNumber,
  articlePart,
  onChange,
}: ArticlePickerProps) {
  const articles = useArticlesStore((s) => s.index());
  const [query, setQuery] = useState(articleNumber);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Закрывать дропдаун по клику вне.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  // Синхронизировать поле ввода при внешнем изменении.
  useEffect(() => {
    setQuery(articleNumber);
  }, [articleNumber]);

  const filtered = useMemo(
    () => searchArticles(articles, query).slice(0, 30),
    [articles, query],
  );

  const currentArticle = articles.find((a) => a.number === articleNumber);
  const partOptions = currentArticle?.parts ?? [];

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <input
        className={styles.input}
        value={query}
        placeholder="Статья (номер или название)"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
      />
      <select
        className={styles.partSelect}
        value={articlePart}
        onChange={(e) => onChange(articleNumber, e.target.value)}
        disabled={partOptions.length === 0}
      >
        {partOptions.length === 0 ? (
          <option value="">— нет частей —</option>
        ) : (
          partOptions.map((p) => (
            <option key={p.part} value={p.part}>
              ч. {p.part}
            </option>
          ))
        )}
      </select>

      {open && (
        <div className={styles.dropdown}>
          {filtered.length === 0 ? (
            <div className={styles.empty}>
              Ничего не найдено. Можно ввести номер вручную — статья отмечается как «user».
            </div>
          ) : (
            filtered.map((a) => (
              <div
                key={a.number}
                className={`${styles.option} ${a.number === articleNumber ? styles.optionActive : ''}`}
                onMouseDown={(e) => {
                  e.preventDefault(); // чтобы инпут не терял фокус
                  onChange(a.number, a.parts[0]?.part ?? '1');
                  setQuery(a.number);
                  setOpen(false);
                }}
              >
                <span className={styles.optionNumber}>
                  ст. {a.number} {a.source === 'user' && '· user'}
                </span>
                <span className={styles.optionTitle}>{a.title}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

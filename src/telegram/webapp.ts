/**
 * Тонкий слой интеграции с Telegram Web Apps.
 *
 * Что делает:
 *   • detectTelegram() — true, если запущено внутри Telegram (есть SDK).
 *   • initTelegram() — вызывает ready/expand, подписывается на смену темы,
 *     прокидывает CSS-переменные Telegram theme в наш palette.
 *   • applyThemeVars() — синхронизирует Telegram theme → CSS-токены.
 *
 * НЕ зависим от npm-пакетов: достаточно скрипта `telegram-web-app.js` из
 * index.html. Если SDK недоступен — все функции no-op (работаем как
 * обычный SPA).
 */

import type { TgWebApp } from './telegram-webapp';

/** Получить инстанс Telegram WebApp (если запущены внутри Telegram). */
export function getTg(): TgWebApp | undefined {
  return typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;
}

/** True, если приложение запущено внутри Telegram. */
export function detectTelegram(): boolean {
  const tg = getTg();
  // SDK всегда инжектируется на странице, но `initData` непустое только
  // когда страница реально открыта Telegram-клиентом.
  return !!tg && (tg.initData?.length > 0 || tg.platform !== 'unknown');
}

/**
 * Инициализирует Telegram-окружение:
 *   • ready()           — сообщает Telegram, что мы готовы.
 *   • expand()          — разворачивает Mini App на максимум высоты.
 *   • applyThemeVars()  — переносит цвета Telegram-темы в CSS-токены.
 *   • подписывается на 'themeChanged' для live-обновления темы.
 *
 * Безопасно вызывать при отсутствии SDK — будет no-op.
 */
export function initTelegram(): void {
  const tg = getTg();
  if (!tg) return;

  try {
    tg.ready();
    tg.expand();
    applyThemeVars();

    tg.onEvent('themeChanged', applyThemeVars);
    tg.onEvent('viewportChanged', () => {
      // На некоторых клиентах высота viewport меняется при появлении
      // клавиатуры; повторно expand'имся для полноэкранного режима.
      if (!tg.isExpanded) tg.expand();
    });

    // setHeaderColor поддерживается с Telegram v6.1+; в старых клиентах
    // просто пропускаем — не критично.
    try {
      const ver = parseFloat(tg.version ?? '0');
      if (ver >= 6.1 && tg.setHeaderColor) {
        tg.setHeaderColor('bg_color');
      }
    } catch {
      // no-op
    }
  } catch (err) {
    // Не падаем, если что-то пошло не так — это всего лишь интеграция.
    // eslint-disable-next-line no-console
    console.warn('[telegram] init failed', err);
  }
}

/**
 * Переносит параметры темы Telegram в CSS custom properties нашего
 * приложения. Вызывается на старте и при событии 'themeChanged'.
 *
 * Telegram присылает цвета в hex (#rrggbb). Мы только переопределяем
 * ключевые токены — остальные оставляем как есть, чтобы дизайн не
 * разваливался при экзотических темах.
 */
export function applyThemeVars(): void {
  const tg = getTg();
  if (!tg) return;
  const t = tg.themeParams ?? {};
  const root = document.documentElement;

  const set = (name: string, value: string | undefined) => {
    if (value) root.style.setProperty(name, value);
  };

  set('--tg-bg', t.bg_color);
  set('--tg-text', t.text_color);
  set('--tg-hint', t.hint_color);
  set('--tg-link', t.link_color);
  set('--tg-button', t.button_color);
  set('--tg-button-text', t.button_text_color);
  set('--tg-secondary-bg', t.secondary_bg_color);

  // Помечаем body классом — тяжёлые темные темы триггерят dark-режим
  // через @media в global.css.
  root.dataset.tgScheme = tg.colorScheme;
  root.dataset.tgPlatform = tg.platform;
}

/**
 * Обёртка над showConfirm: использует нативный Telegram-popup, если
 * доступен; иначе — обычный window.confirm.
 *
 * Promise-стиль удобнее для async-кода в обработчиках.
 */
export function tgConfirm(message: string): Promise<boolean> {
  const tg = getTg();
  if (!tg?.showConfirm) {
    return Promise.resolve(window.confirm(message));
  }
  return new Promise((resolve) => {
    tg.showConfirm(message, (ok) => resolve(!!ok));
  });
}

/** Аналогично — alert. */
export function tgAlert(message: string): Promise<void> {
  const tg = getTg();
  if (!tg?.showAlert) {
    window.alert(message);
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    tg.showAlert(message, () => resolve());
  });
}

/**
 * Открыть произвольный URL: внутри Telegram — через openLink (откроется
 * в системном браузере / встроенной WebView). Иначе — window.open.
 */
export function openExternalLink(url: string): void {
  const tg = getTg();
  if (tg?.openLink) {
    tg.openLink(url);
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * React-хуки для работы с Telegram WebApp.
 *
 *   useTelegramMainButton()  — показывает/прячет нативную нижнюю
 *     кнопку Telegram (зелёная «Сохранить как PDF» / «Далее» и т. п.).
 *   useTelegramBackButton()  — нативная стрелка «Назад» в шапке Telegram.
 *
 * Если приложение открыто не в Telegram — хуки no-op.
 */

import { useEffect } from 'react';
import { getTg } from './webapp';

interface MainButtonOptions {
  /** Текст кнопки. Пустая строка = скрыть. */
  text: string;
  /** Колбэк при клике. */
  onClick: () => void;
  /** Заблокировать кнопку (показывается приглушённой). */
  disabled?: boolean;
  /** Показывать спиннер. */
  loading?: boolean;
  /** Скрыть кнопку (тоже = пустой текст). */
  hidden?: boolean;
}

export function useTelegramMainButton({
  text,
  onClick,
  disabled,
  loading,
  hidden,
}: MainButtonOptions): void {
  useEffect(() => {
    const tg = getTg();
    if (!tg) return;
    const btn = tg.MainButton;

    const shouldShow = !hidden && text.length > 0;

    btn.setParams({
      text: text || ' ',
      is_active: !disabled,
      is_visible: shouldShow,
    });

    if (loading) btn.showProgress(true);
    else btn.hideProgress();

    btn.onClick(onClick);

    return () => {
      btn.offClick(onClick);
      // Не скрываем кнопку при unmount — следующий компонент сам её
      // переопределит. Это даёт плавную смену MainButton между этапами.
    };
  }, [text, onClick, disabled, loading, hidden]);
}

interface BackButtonOptions {
  /** Колбэк при клике. Если undefined — кнопка скрыта. */
  onClick?: () => void;
}

export function useTelegramBackButton({ onClick }: BackButtonOptions): void {
  useEffect(() => {
    const tg = getTg();
    if (!tg) return;
    const btn = tg.BackButton;

    if (!onClick) {
      btn.hide();
      return;
    }

    btn.show();
    btn.onClick(onClick);

    return () => {
      btn.offClick(onClick);
      btn.hide();
    };
  }, [onClick]);
}

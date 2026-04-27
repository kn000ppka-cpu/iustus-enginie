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

    const shouldShow = !hidden && text.trim().length > 0;

    try {
      if (!shouldShow) {
        // Просто прячем — НЕ вызываем setParams с пустым текстом,
        // Telegram v6+ бросает WebAppBottomButtonParamInvalid.
        btn.hide();
      } else {
        btn.setParams({
          text: text.trim(),
          is_active: !disabled,
          is_visible: true,
        });
        if (loading) btn.showProgress(true);
        else btn.hideProgress();
      }
    } catch {
      // Telegram API может не поддерживать некоторые методы в старых
      // клиентах — молча игнорируем, приложение продолжает работать.
    }

    btn.onClick(onClick);

    return () => {
      btn.offClick(onClick);
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

    try {
      if (!onClick) {
        btn.hide();
        return;
      }
      btn.show();
      btn.onClick(onClick);
    } catch {
      // no-op
    }

    return () => {
      try {
        btn.offClick(onClick!);
        btn.hide();
      } catch {
        // no-op
      }
    };
  }, [onClick]);
}

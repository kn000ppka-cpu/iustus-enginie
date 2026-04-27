/**
 * Минимальные типы для Telegram WebApp API.
 * Полный SDK: https://core.telegram.org/bots/webapps
 *
 * Объект `window.Telegram.WebApp` инжектируется внешним скриптом
 * `https://telegram.org/js/telegram-web-app.js`, подключённым в index.html.
 *
 * Не зависим от внешнего npm-пакета: API стабильное, типизируем то, что
 * реально используем.
 */

export interface TgThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  header_bg_color?: string;
  accent_text_color?: string;
  section_bg_color?: string;
  section_header_text_color?: string;
  subtitle_text_color?: string;
  destructive_text_color?: string;
}

export interface TgMainButton {
  text: string;
  color: string;
  textColor: string;
  isVisible: boolean;
  isActive: boolean;
  isProgressVisible: boolean;
  setText(text: string): TgMainButton;
  onClick(cb: () => void): TgMainButton;
  offClick(cb: () => void): TgMainButton;
  show(): TgMainButton;
  hide(): TgMainButton;
  enable(): TgMainButton;
  disable(): TgMainButton;
  showProgress(leaveActive?: boolean): TgMainButton;
  hideProgress(): TgMainButton;
  setParams(params: {
    text?: string;
    color?: string;
    text_color?: string;
    is_active?: boolean;
    is_visible?: boolean;
  }): TgMainButton;
}

export interface TgBackButton {
  isVisible: boolean;
  onClick(cb: () => void): TgBackButton;
  offClick(cb: () => void): TgBackButton;
  show(): TgBackButton;
  hide(): TgBackButton;
}

export interface TgHapticFeedback {
  impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
  notificationOccurred(type: 'error' | 'success' | 'warning'): void;
  selectionChanged(): void;
}

export interface TgWebApp {
  initData: string;
  initDataUnsafe: Record<string, unknown>;
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: TgThemeParams;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  isClosingConfirmationEnabled: boolean;

  MainButton: TgMainButton;
  BackButton: TgBackButton;
  HapticFeedback: TgHapticFeedback;

  ready(): void;
  expand(): void;
  close(): void;
  onEvent(eventType: string, cb: () => void): void;
  offEvent(eventType: string, cb: () => void): void;
  sendData(data: string): void;
  openLink(url: string, options?: { try_instant_view?: boolean }): void;
  openTelegramLink(url: string): void;
  showAlert(message: string, cb?: () => void): void;
  showConfirm(message: string, cb?: (ok: boolean) => void): void;
  showPopup(
    params: {
      title?: string;
      message: string;
      buttons?: { id?: string; type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive'; text?: string }[];
    },
    cb?: (id: string) => void,
  ): void;
  setHeaderColor(color: string | 'bg_color' | 'secondary_bg_color'): void;
  setBackgroundColor(color: string | 'bg_color' | 'secondary_bg_color'): void;
  enableClosingConfirmation(): void;
  disableClosingConfirmation(): void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TgWebApp;
    };
  }
}

export {};

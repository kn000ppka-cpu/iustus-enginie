# Iustus Engine — Telegram Mini App

Полная инструкция: как опубликовать приложение и сделать его доступным внутри
Telegram (открывается прямо в чате одной кнопкой).

В состав поставки уже включены:

- Подключение `telegram-web-app.js` SDK в `index.html`.
- Слой интеграции `src/telegram/` (тема, MainButton, BackButton).
- Адаптация PDF-экспорта для Telegram (открытие через blob-URL во внешнем
  браузере, чтобы обойти ограничения встроенной WebView на iOS).
- GitHub Actions workflow `.github/workflows/deploy-pages.yml`,
  автоматически собирающий и публикующий приложение на GitHub Pages при
  push в `main`.
- npm-скрипт `npm run build:telegram` — локальная сборка под mini-app.

Останется только:

1. Залить код в GitHub.
2. Включить GitHub Pages.
3. Создать бота через @BotFather и привязать к нему URL приложения.

---

## 1. Залить проект в GitHub

```bash
cd "/Users/andreymenshikov/Desktop/Iustus Engine"

# Если git ещё не инициализирован
git init
git add .
git commit -m "Iustus Engine: initial public release"

# Создайте пустой репозиторий на github.com (например, iustus-engine).
# Имя репозитория должно совпадать с VITE_BASE_PATH в workflow.
git branch -M main
git remote add origin https://github.com/<ваш-логин>/iustus-engine.git
git push -u origin main
```

> Если хотите дать репозиторию другое имя (не `iustus-engine`), исправьте
> две строки в `.github/workflows/deploy-pages.yml`:
>
> ```yaml
> VITE_BASE_PATH: '/<имя-репо>/'
> ```

## 2. Включить GitHub Pages

1. Откройте репозиторий на github.com → **Settings → Pages**.
2. В разделе **Build and deployment** → **Source** выберите
   **GitHub Actions**.
3. Сохраните. После следующего push в `main` workflow `Deploy Telegram
   Mini App to GitHub Pages` соберёт проект и опубликует его.
4. Дождитесь зелёной галочки во вкладке **Actions**, затем откройте
   `https://<ваш-логин>.github.io/iustus-engine/` — приложение должно
   работать.

> Это и есть тот самый HTTPS URL, который ждёт Telegram. **Запишите его —
> он понадобится в шаге 4.**

## 3. Создать Telegram-бота

1. Откройте Telegram и найдите **[@BotFather](https://t.me/BotFather)**.
2. Отправьте `/newbot`.
3. Введите имя бота (то, что увидят пользователи): например, `Iustus
   Engine`.
4. Введите username (должен заканчиваться на `bot`): например,
   `iustus_engine_bot`.
5. BotFather пришлёт **HTTP API token** — длинная строка вида
   `123456789:AAH...`. Сохраните её надёжно (она нужна только если вы
   потом захотите сделать собственный backend; для самой Mini App токен
   не используется).

## 4. Привязать Mini App к боту

Есть два равноценных варианта.

### Вариант A — кнопка в меню чата (рекомендуется)

1. В чате с **@BotFather** отправьте `/mybots` → выберите своего бота.
2. **Bot Settings → Menu Button → Configure menu button**.
3. **Send Web App** — отправьте URL приложения:
   `https://<ваш-логин>.github.io/iustus-engine/`
4. Введите подпись кнопки, например `🧮 Открыть калькулятор`.

Готово. Теперь любой пользователь, который зашёл в чат с ботом, увидит
синюю кнопку слева от поля ввода — по нажатию открывается Iustus Engine
прямо в Telegram.

### Вариант B — отдельная Mini App (для t.me/-ссылок)

1. У @BotFather: `/newapp` → выберите бота.
2. Введите имя, описание (Russian + English), **квадратную картинку**
   640×360, демо-видео (опционально).
3. Введите **Web App URL**: `https://<ваш-логин>.github.io/iustus-engine/`
4. Введите короткое имя, например `engine`. После этого приложение
   доступно по прямой ссылке: `https://t.me/iustus_engine_bot/engine`.

Этот вариант удобен тем, что вы можете отправить такую ссылку любому
человеку (или вставить в свой канал), и он откроется одним тапом — без
необходимости заранее писать боту.

## 5. Проверить и поделиться

- Откройте чат с ботом → **нажмите Menu** или прямую ссылку
  `t.me/<bot_username>/<short_name>`.
- Должно открыться приложение, развёрнутое на весь экран, в теме
  Telegram (light / dark — автоматически).
- Внизу появится зелёная **MainButton** Telegram («Далее →» на
  промежуточных этапах, «Сохранить приговор в PDF» — на финальном).
- Стрелка «Назад» в шапке Telegram листает этапы назад.

Поделиться:

- Прямая ссылка для друзей: `https://t.me/<bot_username>/<short_name>`
- QR-код (через `qr-server.com` или любой генератор) с этой же ссылкой.
- Размещение в канале / группе: можно прикрепить кнопку «Open
  app» через `inline_keyboard` (нужно собственное API-приложение бота —
  опционально).

---

## Локальная разработка

```bash
npm run dev                   # обычный режим (открывается на localhost:5173)
npm run electron:dev          # тот же UI в Electron
```

Чтобы проверить именно Telegram-интеграцию локально, нужно либо:

1. **Telegram Web (web.telegram.org)** — Mini Apps там работают через
   обычный HTTPS, можно временно засунуть туда URL ngrok-туннеля:
   ```bash
   npm run build:telegram
   npx serve -s dist -p 5173
   # в другом терминале:
   npx ngrok http 5173
   # https-URL ngrok'а вставьте в @BotFather как Web App URL
   ```
2. Либо просто положить debug-флаг в localStorage и эмулировать
   `window.Telegram.WebApp` руками — для проверки логики достаточно.

---

## PDF-экспорт в Telegram

В Mini App PDF открывается **во внешнем браузере** через blob-URL —
там пользователь может «Поделиться → Сохранить в Файлы» (iOS) или
просто «Скачать» (Android / desktop).

Прямой `download()` не используется, потому что встроенная WebView
Telegram на iOS блокирует автоматическое скачивание. Для desktop-пользо-
вателей с таким же кодом всё работает по-старому — через нативный диалог
сохранения.

---

## Что Telegram-клиент видит автоматически

| Параметр                       | Источник                     |
|--------------------------------|------------------------------|
| Тема (light / dark)            | `themeParams` от Telegram    |
| Полный экран                   | `WebApp.expand()` на старте  |
| Кнопка «Назад» в шапке         | `BackButton.show()` со 2-го этапа |
| Зелёная нижняя MainButton      | `MainButton.setParams()` на каждом этапе |
| Подтверждение «Сбросить кейс»  | `WebApp.showConfirm()` (нативный popup) |

---

## Альтернативные хостинги (если не хотите GitHub Pages)

Минимально нужен любой статический HTTPS-хостинг — приложение целиком
клиентское, бэкенда нет. Подойдёт:

- **Vercel** — `vercel deploy` после `npm run build:telegram` (поставьте
  `VITE_BASE_PATH=/`).
- **Cloudflare Pages** — подключите репозиторий, build command
  `npm run build:telegram`, output `dist`.
- **Netlify** — `npm run build:telegram` + drag-n-drop папки `dist` в
  netlify.app.
- **Свой VPS** — `dist/` через любой nginx с HTTPS-сертификатом
  (Let's Encrypt бесплатно).

---

## FAQ

**Можно без бота?** Нет. Telegram Mini App жёстко привязан к боту через
@BotFather; URL без бота открыть нельзя.

**Сохраняются ли кейсы между запусками?** Да, через `localStorage`
самого Telegram-клиента. Один и тот же пользователь увидит сохранённый
расчёт при повторном открытии. Но между разными устройствами синхрони-
зации НЕТ — это полностью клиентское приложение.

**Безопасно ли это для адвоката / клиента?** Все вычисления и хранение
идут на устройстве пользователя. Сервер отдаёт только статичный HTML/JS
(без бэкенда). Telegram видит только факт открытия Mini App, но не
содержимое расчёта.

**Сколько стоит?** GitHub Pages — бесплатно (до 100 ГБ трафика в месяц).
Telegram-бот — бесплатно. Итого: 0 ₽/мес.

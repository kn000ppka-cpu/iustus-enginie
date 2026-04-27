import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '@ui/App';
import { initTelegram } from '@telegram/webapp';
import './ui/styles/global.css';
import '@telegram/telegram.css';

// Если приложение открыто внутри Telegram Mini App — инициализируем SDK
// (тема, expand, ready). Вне Telegram — это no-op.
initTelegram();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

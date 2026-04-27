import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig(({ mode: _mode }) => ({
  // base:
  //   - по умолчанию './' — Electron грузит SPA из file:// (relative-paths).
  //   - для GitHub Pages / Telegram Mini App переопределяется через
  //     VITE_BASE_PATH ('/iustus-engine/'), см. .github/workflows/deploy-pages.yml
  //     и npm run build:telegram.
  base: process.env.VITE_BASE_PATH || './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@domain': path.resolve(__dirname, './src/domain'),
      '@legal': path.resolve(__dirname, './src/legal'),
      '@engine': path.resolve(__dirname, './src/engine'),
      '@state': path.resolve(__dirname, './src/state'),
      '@ui': path.resolve(__dirname, './src/ui'),
      '@export': path.resolve(__dirname, './src/export'),
      '@telegram': path.resolve(__dirname, './src/telegram'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 5173,
    open: false,
  },
}));

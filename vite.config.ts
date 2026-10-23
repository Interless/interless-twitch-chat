import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    target: 'chrome120',
    cssTarget: 'chrome120',
    outDir: 'dist/streamelements',
    emptyOutDir: true,
    copyPublicDir: false,
    sourcemap: false,
    lib: {
      entry: resolve(import.meta.dirname, 'src/main.tsx'),
      name: 'TwitchChatOverlay',
      formats: ['iife'],
      fileName: () => 'widget.js',
      cssFileName: 'widget',
    },
  },
});

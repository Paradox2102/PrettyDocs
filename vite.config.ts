/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // three.js is most of the lazy 3D chunk (about 950 kB, 250 kB gzip); only the 3D page and the hero load it.
  build: { chunkSizeWarningLimit: 1000 },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test/setup.ts'],
    css: true,
  },
});

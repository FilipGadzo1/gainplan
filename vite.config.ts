/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Pinned rather than left to Vite's default-and-drift behaviour. Without
    // strictPort, a busy port makes Vite quietly walk up to the next free one,
    // so the app comes up on whatever origin happens to be going. That matters
    // because browsers cache favicons and localStorage per origin: land on a
    // port another project used and you inherit its tab icon out of cache.
    // Failing loudly is better than starting on the wrong origin.
    port: 5173,
    strictPort: true,
  },
  test: {
    // Component tests need a DOM; the planner tests run fine either way.
    environment: 'jsdom',
    globals: true,
  },
});

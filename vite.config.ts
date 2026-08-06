/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Pinned well clear of Vite's default 5173, because every other Vite
    // project uses that too. Browsers cache favicons and localStorage per
    // origin, and http://localhost:5173 is the same origin no matter which
    // project is serving it — sharing it means this app shows another one's
    // tab icon out of cache.
    //
    // strictPort matters as much as the number: without it Vite quietly walks
    // up to the next free port, which lands the app on an origin some other
    // project has already polluted. Better to fail and say so.
    port: 5173,
    strictPort: true,
  },
  test: {
    // Component tests need a DOM; the planner tests run fine either way.
    environment: 'jsdom',
    globals: true,
  },
});

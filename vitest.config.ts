import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  // Vite strips 'node:' prefix when resolving, so 'node:sqlite' becomes 'sqlite'.
  // Marking it external tells vite not to bundle it (let Node handle it).
  ssr: {
    external: ['sqlite', 'node:sqlite'],
  },
  optimizeDeps: {
    exclude: ['sqlite', 'node:sqlite'],
  },
});

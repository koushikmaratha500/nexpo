import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'release3.0/tests/**/*.test.ts',
      'release4.0/tests/**/*.test.ts',
      'tests/**/*.test.ts',
    ],
    setupFiles: ['tests/setup.ts'],
    clearMocks: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});

// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          globals: true,
          environment: 'node',
          include: ['src/**/*.test.ts', 'server/src/__tests__/**/*.test.js'],
        },
      },
      {
        test: {
          name: 'components',
          globals: true,
          environment: 'jsdom',
          include: ['src/**/*.test.tsx'],
          setupFiles: ['src/__tests__/setup.ts'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}', 'server/src/**/*.js'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'server/src/__tests__/**/*.js',
        'src/__tests__/**',
        'src/vite-env.d.ts',
      ],
    },
  },
});

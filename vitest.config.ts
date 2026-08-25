import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

/**
 * Root vitest config — owns the unit-test scope for the monorepo root:
 *
 *   - lib/                 (zustand stores, services, utils, hooks)
 *   - components/          (React components, when introduced)
 *
 * Explicitly excluded:
 *
 *   - packages/           Each package has its own vitest.config.ts and runs
 *                         independently via `pnpm --filter <pkg> test`.
 *                         Including them here would double-run them.
 *   - e2e/                Playwright territory (.spec.ts files). Has its own
 *                         playwright.config.ts and runs via `pnpm test:e2e`.
 *
 * Historical note: this file used to point at a `tests` directory and a
 * `tests/setup-env.ts` setup filepath. Both were dead references — that
 * directory never existed in this repo. Removed 2026-08-25 (CM2 vitest fix).
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
  test: {
    include: [
      'lib/**/__tests__/**/*.test.ts',
      'lib/**/*.test.ts',
      'components/**/__tests__/**/*.test.ts',
      'components/**/*.test.ts',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/e2e/**',
      '**/packages/**',
    ],
  },
});

import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  // Reference individual package configs
  './packages/languages/study-configuration/vitest.config.ts',
  './packages/webapp-crchub/vitest.config.ts',
  './packages/meta/src/vitest.config.ts',
  // Inline configs for packages without explicit config files
  {
    test: {
      name: 'core',
      root: './packages/core',
      include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      exclude: ['**/node_modules/**', '**/dist/**'],
      globals: true,
      environment: 'node',
    },
  },
  {
    test: {
      name: 'server-crchub',
      root: './packages/server-crchub',
      include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      exclude: ['**/node_modules/**', '**/dist/**'],
      globals: true,
      environment: 'node',
    },
  },
]);
 
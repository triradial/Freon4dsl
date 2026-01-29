import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  // Priority: Language packages first (most important for development)
  './packages/languages/study-configuration/vitest.config.ts',
  './packages/languages/project-configuration/vitest.config.ts',
  // Other packages
  './packages/webapp-crchub/vitest.config.ts',
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
 
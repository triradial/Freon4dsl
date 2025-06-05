import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    conditions: ['svelte', 'import', 'module', 'browser', 'default'],
    mainFields: ['svelte', 'browser', 'module', 'main']
  },
  build: {
    rollupOptions: {
      external: [
        'lodash',
        'mobx',
        'tslib',
        'flowbite-svelte'
      ]
    }
  },
  optimizeDeps: {
    exclude: ['@freon4dsl/core', 'flowbite-svelte']
  }
}); 
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [
        'svelte',
        'mobx',
        '@lionweb/repository-client',
        '@lionweb/validation',
        'reflect-metadata',
        'lodash',
        'debug',
      ],
    },
  },
  esbuild: {
    target: 'esnext',
    supported: {
      'top-level-await': true
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext'
    }
  }
}); 
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        runes: true // Enable Svelte 5 runes
      }
    })
  ],
  build: {
    lib: {
      entry: 'src/lib/index.ts',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: [
        'svelte',
        '@freon4dsl/core',
        'lodash',
        'debug',
        '@lionweb/validation',
        '@lionweb/repository-client',
        'mobx',
        'reflect-metadata',
        'tslib',
        '@material/web',
        '@material/slider',
        '@material/switch'
      ]
    }
  },
  esbuild: {
    target: 'esnext',
    supported: {
      'top-level-await': true
    }
  },
  optimizeDeps: {
    exclude: ['@freon4dsl/core'],
    esbuildOptions: {
      target: 'esnext'
    }
  }
}); 
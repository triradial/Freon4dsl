import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import dotenv from 'dotenv';
import path from 'path';
import type { UserConfig } from 'vite';

dotenv.config();
console.log('Building with environment:', {
  AZURE_ENVIRONMENT: process.env.AZURE_ENVIRONMENT,
  NODE_ENV: process.env.NODE_ENV
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        dev: process.env.NODE_ENV !== 'production',
        runes: true // Enable Svelte 5 runes
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      'svelte-routing': path.resolve(__dirname, '../../node_modules/svelte-routing/src/index.js')
    }
  },
  build: {
    target: 'esnext',
    sourcemap: true,
    outDir: 'public/assets',
    rollupOptions: {
      input: 'src/main.ts',
      output: {
        entryFileNames: 'scripts/[name].js',
        chunkFileNames: 'scripts/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      },
      external: [
        'child_process',
        'fs',
        'path',
        'url',
        'crypto',
        'fs/promises'
      ]
    }
  },
  server: {
    port: 8002,
    strictPort: true
  },
  define: {
    'process.env.AZURE_ENVIRONMENT': JSON.stringify(process.env.AZURE_ENVIRONMENT || 'local'),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext'
    }
  }
} as UserConfig); 
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    sveltekit(),
    // Middleware to suppress 404s for node_modules source files
    {
      name: 'suppress-node-modules-404',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Suppress 404s for TypeScript source files in node_modules
          if (req.url?.includes('/node_modules/') && 
              (req.url.endsWith('.ts') || req.url.endsWith('.tsx'))) {
            res.statusCode = 204; // No Content
            res.end();
            return;
          }
          next();
        });
      }
    }
  ],
  server: {
    port: 5173,
    watch: {
      // Ignore study-configuration dist and freon generated files to prevent HMR storm when rebuilding the language
      ignored: [
        '/Users/mikevogel/projects/Freon4dsl/packages/languages/study-configuration/dist/**',
        '/Users/mikevogel/projects/Freon4dsl/packages/languages/study-configuration/src/freon/**'
      ]
    }
  },
  resolve: {
    conditions: ['svelte', 'import', 'module', 'browser', 'default'],
    mainFields: ['svelte', 'browser', 'module', 'main'],
    // Dedupe packages to ensure singleton instances work correctly across the monorepo
    dedupe: [
      '@freon4dsl/core',
      '@freon4dsl/core-svelte',
      '@freon4dsl/study-configuration',
      'mobx',
      'svelte'
    ]
  },
  build: {
    sourcemap: false, // Disable source maps in production build
    rollupOptions: {
      external: [
        'lodash',
        'mobx',
        'tslib'
      ]
    }
  },
  optimizeDeps: {
    exclude: ['@freon4dsl/core']
  }
}); 
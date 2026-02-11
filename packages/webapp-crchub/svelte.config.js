// import { vitePreprocess } from '@sveltejs/kit/vite';
import adapterAuto from '@sveltejs/adapter-auto';
import adapterNode from '@sveltejs/adapter-node';

// Use adapter-node for production builds (Azure), adapter-auto for local dev
const isProduction = process.env.NODE_ENV === 'production' || process.env.AZURE_ENVIRONMENT;
const adapter = isProduction ? adapterNode : adapterAuto;

/** @type {import('@sveltejs/kit').Config} */
const config = {
  compilerOptions: {
    runes: true
  },
  // preprocess: vitePreprocess(), // Removed for Svelte 5 compatibility
  kit: {
    adapter: adapter(),
    alias: {
      $lib: 'src/lib',
      $components: 'src/components',
      $services: 'src/services',
      $content: 'src/content',
    }
  }
};

export default config; 
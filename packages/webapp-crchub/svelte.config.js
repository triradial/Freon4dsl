// import { vitePreprocess } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-node';

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
import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        emptyOutDir: false, // preserve tsc output (e.g. index.js) when bundling index.custom.js
        lib: {
            entry: 'src/index.custom.ts',
            formats: ['es'],
            fileName: 'index.custom'
        },
        sourcemap: true,
        rollupOptions: {
            external: [
                '@freon4dsl/core',
                'net.akehurst.language-agl-processor',
                '@bscotch/utility'
            ],
            output: {
                globals: {
                    'kotlin': 'kotlin',
                    'agl': 'net.akehurst.language-agl-processor',
                }
            },
            onwarn(warning, warn) {
                if (warning.code === 'CIRCULAR_DEPENDENCY') {
                    return;
                }
                // Suppress sourcemap warnings for external packages
                if (warning.code === 'SOURCEMAP_BROKEN' || 
                    (warning.message && warning.message.includes('points to missing source files'))) {
                    return;
                }
                warn(warning);
            }
        }
    }
}); 
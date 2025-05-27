import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        lib: {
            entry: {
                index: 'src/index.ts',
                'bin/freon-generator': 'src/bin/freon-generator.ts'
            },
            formats: ['es'],
            fileName: (format, entryName) => `${entryName}.js`
        },
        rollupOptions: {
            external: [
                '@rushstack/ts-command-line', 
                'source-map-support',
                '@freon4dsl/core',
                '@lionweb/validation',
                'peggy',
                'pegjs',
                'kotlin',
                '@prettier/sync',
                'tslib',
                'prettier'
            ],
            output: {
                format: 'es',
                exports: 'named',
                preserveModules: true,
                preserveModulesRoot: 'src',
                hoistTransitiveImports: false
            }
        }
    },
    resolve: {
        alias: [
            {
                find: /^(.*)\.js$/,
                replacement: '$1',
            }
        ]
    },
    optimizeDeps: {
        include: ['net.akehurst.language-agl-processor'],
        esbuildOptions: {
            target: 'esnext'
        }
    },
    esbuild: {
        target: 'esnext'
    }
}); 
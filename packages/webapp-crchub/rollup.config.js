import svelte from 'rollup-plugin-svelte';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import livereload from 'rollup-plugin-livereload';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import css from 'rollup-plugin-css-only';
import { sveltePreprocess } from 'svelte-preprocess';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';
import injectProcessEnv from 'rollup-plugin-inject-process-env';
import childProcess from 'child_process';

const production = !process.env.ROLLUP_WATCH;
const dev = true;

function serve() {
	let server;

	function toExit() {
		if (server) server.kill(0);
	}

	return {
		writeBundle() {
			if (server) return;
			server = childProcess.spawn('npm', ['run', 'start', '--', '--dev'], {
				stdio: ['ignore', 'inherit', 'inherit'],
				shell: true
			});
			process.on('SIGTERM', toExit);
			process.on('exit', toExit);
		}
	};
}

export default {
  input: 'src/main.ts',
  output: {
    sourcemap: true,
    format: 'iife',
    name: 'app',
    file: 'public/build/bundle.js'
  },
  plugins: [
    svelte({
      preprocess: sveltePreprocess({ sourceMap: !production }),
      compilerOptions: {
        dev: !production
      }
    }),
    css({ output: 'bundle.css' }),
    json(),
    resolve({
      browser: true,
      dedupe: ['svelte'],
      exportConditions: ['svelte'],
      extensions: ['.svelte', '.mjs', '.js', '.json', '.node']
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify(production ? 'production' : 'development'),
      preventAssignment: true
    }),
    commonjs(),
    typescript({
      sourceMap: !production || dev,
      inlineSources: !production || dev
    }),
    injectProcessEnv({
			NODE_ENV: 'development',
			NODE_PORT: '8001'
		}),
    		// In dev mode, call `npm run start` once
		// the bundle has been generated
		!production && serve(),

		// Watch the `public` directory and refresh the
		// browser on changes when not in production
		!production && livereload('public'),

    // If we're building for production (npm run build
		// instead of npm run dev), minify
    production && terser()
  ],
  watch: {
    clearScreen: false
  }
};
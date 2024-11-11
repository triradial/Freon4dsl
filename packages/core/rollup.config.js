import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import pkg from './package.json' with { type: 'json'};
import dts from 'rollup-plugin-dts';
import copy from 'rollup-plugin-copy';

const production = false;

const config = [
	{
		input: 'src/index.ts',
		output: [
			{
				sourcemap: true,
				format: 'es',
				name: pkg.name,
				file: pkg.main,
			}
			// Uncomment to generate commonjs, but did not manage to get this working ok
			// {
			// 	coiurcemap: true
			// 	file: 'dist/index.cjs',
			// 	format: 'cjs'
			//
			// }
			// Uncomment to generate commonjs, but did not manage to get this working ok
			// {
			// 	coiurcemap: true
			// 	file: 'dist/index.cjs',
			// 	format: 'cjs'
			//
			// }
		],
		plugins: [
			nodeResolve({
				extensions: ['.ts', '.js', '.json'],
				preferBuiltins: true
			}),
			typescript({
				tsconfig: './tsconfig.json',
				sourceMap: true,
				inlineSources: true,
				module: 'NodeNext',
				target: 'es2021',
				moduleResolution: 'nodenext'
			}),
			// If we're building for production (npm run build
			// instead of npm run dev), minify
			production && terser()
		],
		// Explicitly declare external dependencies
		external: [
			'mobx',
			'lodash',
			'@lionweb/repository-client',
			'reflect-metadata',
			'@fortawesome/free-solid-svg-icons',
			'@fortawesome/fontawesome-svg-core',
			'@fortawesome/svelte-fontawesome',
			'@lionweb/validation'
		]
	},
	{
		// create a bundled version of the types for use in the sveltekit packages
		input: "./dist/dts/index.d.ts",
		output: [{ file: 'dist/index.d.ts', format: 'es' }],
		plugins: [dts()],
	},
]

export default config;

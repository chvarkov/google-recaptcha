import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	// SWC is required to emit decorator metadata (emitDecoratorMetadata) for NestJS DI.
	plugins: [swc.vite({ module: { type: 'es6' } })],
	test: {
		globals: true,
		environment: 'node',
		include: ['test/**/*.spec.ts'],
		coverage: {
			provider: 'v8',
			include: ['src/**/*.ts'],
			reportsDirectory: './coverage',
		},
	},
});

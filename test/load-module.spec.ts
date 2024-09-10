import { loadModule } from '../src/helpers/load-module';
import { Reflector } from '@nestjs/core';

describe('loadModule', () => {
	test('load', () => {
		const module = loadModule('@nestjs/core');
		expect(module).toBeDefined();
		expect(module.Reflector).toEqual(Reflector);
	});

	test('failed load', () => {
		expect(() => loadModule('@unknown/unknown-package', true)).toThrowError('Cannot find module');
		expect(() => loadModule('@unknown/unknown-package', false)).toThrowError('Cannot find module');
	});
});

import { Logger } from '@nestjs/common';
import { createRequire } from 'node:module';

// Synchronous loading of optional dependencies (e.g. `@nestjs/graphql`) from an ES module.
const require = createRequire(import.meta.url);

export function loadModule<T = unknown>(moduleName: string, logError = false): T {
	try {
		return require(moduleName);
	} catch (e) {
		if (logError) {
			Logger.error(`Module '${moduleName}' not found.\nPossible solution: npm i ${moduleName}`);
		}
		throw e;
	}
}

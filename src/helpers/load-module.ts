import { Logger } from '@nestjs/common';

export function loadModule<T = unknown>(moduleName: string, logError = false): T {
	try {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		return require(moduleName);
	} catch (e) {
		if (logError) {
			Logger.error(`Module '${moduleName}' not found.\nPossible solution: npm i ${moduleName}`);
		}
		throw e;
	}
}

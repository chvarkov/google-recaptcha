import { Logger } from '@nestjs/common';
import { LiteralObject } from '../interfaces/literal-object';

export function loadModule(moduleName: string, logError = false): LiteralObject {
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

import { Logger } from '@nestjs/common';
import { LiteralObject } from '../interfaces/literal-object';

export function loadModule(moduleName: string, logError = false): LiteralObject {
	try {
		return require(moduleName);
	} catch (e) {
		if (logError) {
			Logger.error(`Module '${moduleName}' not found. \nPotential solution npm i  ${moduleName}`);
		}
		throw e;
	}
}

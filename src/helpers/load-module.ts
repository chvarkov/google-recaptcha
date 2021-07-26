import { Logger } from '@nestjs/common';

export function loadModule(moduleName: string, logError = false): any {
    try {
        return require(moduleName);
    } catch (e) {
        if (logError) {
            Logger.error(`Module '${moduleName}' not found. \nPotential solution npm i  ${moduleName}`);
        }
        throw e;
    }
}

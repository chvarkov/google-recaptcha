import { Logger } from '@nestjs/common';

export function loadModule(moduleName: string): any {
    try {
        return require(moduleName);
    } catch (e) {
        Logger.error(`Module '${moduleName}' not found. \nPotential solution npm i  ${moduleName}`);
        throw e;
    }
}

import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { ApplicationType } from '../enums/application-type';

@Injectable()
export class RecaptchaRequestResolver {
    resolve<T = any>(context: ExecutionContext, type: ApplicationType): T {
        switch (type) {
            case ApplicationType.Rest:
                return context.switchToHttp().getRequest();

            case ApplicationType.GraphQL:
                const graphqlModule = this.loadModule('@nestjs/graphql');
                return graphqlModule.GqlExecutionContext.create(context).getContext().req?.connection?._httpMessage?.req;
            default:
                throw new Error(`Unsupported request type '${type}'.`);
        }
    }

    private loadModule(moduleName: string): any {
        try {
            return require(moduleName);
        } catch (e) {
            Logger.error(`Module '${moduleName}' not found. \nPotential solution npm i  ${moduleName}`);
            throw e;
        }
    }
}

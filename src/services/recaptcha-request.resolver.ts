import { ExecutionContext, Injectable } from '@nestjs/common';
import { ApplicationType } from '../enums/application-type';
import { loadModule } from '../helpers/load-module';
import { RecaptchaContextType } from '../types';

@Injectable()
export class RecaptchaRequestResolver {
    resolve<T = any>(context: ExecutionContext): T {
        const contextType: RecaptchaContextType = context.getType();

        switch (contextType) {
            case 'http':
                return context.switchToHttp().getRequest();

            case 'graphql':
                const graphqlModule = loadModule('@nestjs/graphql', true);
                return graphqlModule.GqlExecutionContext.create(context).getContext().req?.connection?._httpMessage?.req;
            default:
                throw new Error(`Unsupported request type '${contextType}'.`);
        }
    }

    /**
     * @deprecated
     */
    resolveByApplicationType<T = any>(context: ExecutionContext, type: ApplicationType): T {
        switch (type) {
            case ApplicationType.Rest:
                return context.switchToHttp().getRequest();

            case ApplicationType.GraphQL:
                const graphqlModule = loadModule('@nestjs/graphql', true);
                return graphqlModule.GqlExecutionContext.create(context).getContext().req?.connection?._httpMessage?.req;
            default:
                throw new Error(`Unsupported request type '${type}'.`);
        }
    }
}

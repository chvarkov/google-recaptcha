import { ExecutionContext, Injectable } from '@nestjs/common';
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
                return graphqlModule.GqlExecutionContext.create(context).getContext().req?.socket?._httpMessage?.req;
            default:
                throw new Error(`Unsupported request type '${contextType}'.`);
        }
    }
}

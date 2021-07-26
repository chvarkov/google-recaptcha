import { ExecutionContext, Injectable } from '@nestjs/common';
import { ApplicationType } from '../enums/application-type';
import { loadModule } from '../helpers/load-module';

@Injectable()
export class RecaptchaRequestResolver {
    resolve<T = any>(context: ExecutionContext, type: ApplicationType): T {
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

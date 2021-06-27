import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const RecaptchaResult = createParamDecorator((data, context: ExecutionContext) => {
    switch (context.getType<'http' | 'graphql'>()) {
        case 'http':
            return context.switchToHttp().getRequest().recaptchaValidationResult;
        case 'graphql':
            const graphqlModule = this.loadModule('@nestjs/graphql');
            return graphqlModule.GqlExecutionContext.create(context).getContext().req?.connection?._httpMessage?.req?.recaptchaValidationResult;
        default:
            return null;
    }
})

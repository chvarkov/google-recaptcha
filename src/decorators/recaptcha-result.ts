import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { loadModule } from '../helpers/load-module';

export const RecaptchaResult = createParamDecorator((data, context: ExecutionContext) => {
	switch (context.getType<'http' | 'graphql'>()) {
		case 'http':
			return context.switchToHttp().getRequest().recaptchaValidationResult;
		case 'graphql':
			return loadModule('@nestjs/graphql', true).GqlExecutionContext.create(context).getContext().req?.connection?._httpMessage?.req
				?.recaptchaValidationResult;
	}
});

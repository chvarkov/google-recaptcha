import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { resolveRequest } from '../helpers/resolve-request';

export const RecaptchaResult = createParamDecorator((data, context: ExecutionContext) => resolveRequest(context).recaptchaValidationResult);

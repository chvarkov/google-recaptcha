import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { resolveRequest } from '../helpers/resolve-request.js';

export const RecaptchaResult = createParamDecorator((data, context: ExecutionContext) => resolveRequest(context).recaptchaValidationResult);

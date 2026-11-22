import { applyDecorators, UseGuards } from '@nestjs/common';
import { GoogleRecaptchaGuard } from '../guards/google-recaptcha.guard.js';
import { VerifyResponseDecoratorOptions } from '../interfaces/verify-response-decorator-options.js';
import { SetRecaptchaOptions } from './set-recaptcha-options.js';

export function Recaptcha(options?: VerifyResponseDecoratorOptions): MethodDecorator & ClassDecorator {
	return applyDecorators(SetRecaptchaOptions(options), UseGuards(GoogleRecaptchaGuard));
}

import { CanActivate, ExecutionContext, Inject, Injectable, Logger } from '@nestjs/common';
import { RECAPTCHA_LOGGER, RECAPTCHA_VALIDATION_OPTIONS } from '../provider.declarations';
import { GoogleRecaptchaException } from '../exceptions/google-recaptcha.exception';
import { Reflector } from '@nestjs/core';
import { RecaptchaRequestResolver } from '../services/recaptcha-request.resolver';
import { VerifyResponseDecoratorOptions } from '../interfaces/verify-response-decorator-options';
import { RecaptchaValidatorResolver } from '../services/recaptcha-validator.resolver';
import { RecaptchaRequest } from '../helpers/resolve-request';
import { RecaptchaConfigRef } from '../models/recaptcha-config-ref';

@Injectable()
export class GoogleRecaptchaGuard implements CanActivate {
	constructor(
		private readonly reflector: Reflector,
		private readonly requestResolver: RecaptchaRequestResolver,
		private readonly validatorResolver: RecaptchaValidatorResolver,
		@Inject(RECAPTCHA_LOGGER) private readonly logger: Logger,
		private readonly configRef: RecaptchaConfigRef
	) {}

	async canActivate(context: ExecutionContext): Promise<true | never> {
		const request = this.requestResolver.resolve<RecaptchaRequest>(context);

		const skipIfValue = this.configRef.valueOf.skipIf;
		const skip = typeof skipIfValue === 'function' ? await skipIfValue(request) : !!skipIfValue;

		if (skip) {
			return true;
		}

		const options = this.resolveDecoratorOptions(context);
		const config = this.configRef.valueOf;

		const responseProvider = options.response ?? config.response;
		const remoteIpProvider = options.remoteIp ?? config.remoteIp;

		const [response, remoteIp] = await Promise.all([responseProvider(request), remoteIpProvider?.(request)]);

		// Score falls back to module config inside the validator.
		const { score, action } = options;

		const validator = this.validatorResolver.resolve();

		const result = await validator.validate({ response, remoteIp, score, action });

		// Read by the @RecaptchaResult() decorator.
		request.recaptchaValidationResult = result;

		if (this.configRef.valueOf.debug) {
			this.logger.debug(result.toObject(), `${validator.logContext}.result`);
		}

		if (result.success) {
			return true;
		}

		throw new GoogleRecaptchaException(result.errors);
	}

	private resolveDecoratorOptions(context: ExecutionContext): VerifyResponseDecoratorOptions {
		const classOptions: VerifyResponseDecoratorOptions = this.reflector.get(RECAPTCHA_VALIDATION_OPTIONS, context.getClass());
		const handlerOptions: VerifyResponseDecoratorOptions = this.reflector.get(RECAPTCHA_VALIDATION_OPTIONS, context.getHandler());

		return { ...classOptions, ...handlerOptions };
	}
}

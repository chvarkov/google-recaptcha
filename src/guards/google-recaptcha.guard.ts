import { CanActivate, ExecutionContext, Inject, Injectable, Logger } from '@nestjs/common';
import { RECAPTCHA_LOGGER, RECAPTCHA_VALIDATION_OPTIONS } from '../provider.declarations';
import { GoogleRecaptchaException } from '../exceptions/google-recaptcha.exception';
import { Reflector } from '@nestjs/core';
import { RecaptchaRequestResolver } from '../services/recaptcha-request.resolver';
import { VerifyResponseDecoratorOptions } from '../interfaces/verify-response-decorator-options';
import { RecaptchaValidatorResolver } from '../services/recaptcha-validator.resolver';
import { GoogleRecaptchaContext } from '../enums/google-recaptcha-context';
import { AbstractGoogleRecaptchaValidator } from '../services/validators/abstract-google-recaptcha-validator';
import { GoogleRecaptchaEnterpriseValidator } from '../services/validators/google-recaptcha-enterprise.validator';
import { LiteralObject } from '../interfaces/literal-object';
import { RecaptchaConfigRef } from '../models/recaptcha-config-ref';

@Injectable()
export class GoogleRecaptchaGuard implements CanActivate {
	constructor(
		private readonly reflector: Reflector,
		private readonly requestResolver: RecaptchaRequestResolver,
		private readonly validatorResolver: RecaptchaValidatorResolver,
		@Inject(RECAPTCHA_LOGGER) private readonly logger: Logger,
		private readonly configRef: RecaptchaConfigRef,
	) {}

	async canActivate(context: ExecutionContext): Promise<true | never> {
		const request: LiteralObject = this.requestResolver.resolve(context);

		const skipIfValue = this.configRef.valueOf.skipIf;
		const skip = typeof skipIfValue === 'function' ? await skipIfValue(request) : !!skipIfValue;

		if (skip) {
			return true;
		}

		const options: VerifyResponseDecoratorOptions = this.reflector.get(RECAPTCHA_VALIDATION_OPTIONS, context.getHandler());

		const [response, remoteIp] = await Promise.all([
			options?.response ? await options.response(request) : await this.configRef.valueOf.response(request),
			options?.remoteIp ? await options.remoteIp(request) : await this.configRef.valueOf.remoteIp && this.configRef.valueOf.remoteIp(request),
		]);

		const score = options?.score || this.configRef.valueOf.score;
		const action = options?.action;

		const validator = this.validatorResolver.resolve();

		request.recaptchaValidationResult = await validator.validate({ response, remoteIp, score, action });

		if (this.configRef.valueOf.debug) {
			const loggerCtx = this.resolveLogContext(validator);
			this.logger.debug(request.recaptchaValidationResult.toObject(), `${loggerCtx}.result`);
		}

		if (request.recaptchaValidationResult.success) {
			return true;
		}

		throw new GoogleRecaptchaException(request.recaptchaValidationResult.errors);
	}

	private resolveLogContext(validator: AbstractGoogleRecaptchaValidator<unknown>): GoogleRecaptchaContext {
		return validator instanceof GoogleRecaptchaEnterpriseValidator
			? GoogleRecaptchaContext.GoogleRecaptchaEnterprise
			: GoogleRecaptchaContext.GoogleRecaptcha;
	}
}

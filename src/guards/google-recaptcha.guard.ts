import { CanActivate, ExecutionContext, Inject, Injectable, Logger } from '@nestjs/common';
import { RECAPTCHA_LOGGER, RECAPTCHA_VALIDATION_OPTIONS } from '../provider.declarations.js';
import { GoogleRecaptchaException } from '../exceptions/google-recaptcha.exception.js';
import { ErrorCode } from '../enums/error-code.js';
import { Reflector } from '@nestjs/core';
import { RecaptchaRequestResolver } from '../services/recaptcha-request.resolver.js';
import { VerifyResponseDecoratorOptions } from '../interfaces/verify-response-decorator-options.js';
import { RecaptchaValidatorResolver } from '../services/recaptcha-validator.resolver.js';
import { RecaptchaRequest } from '../helpers/resolve-request.js';
import { RecaptchaConfigRef } from '../models/recaptcha-config-ref.js';
import { safeDebug } from '../helpers/safe-debug.js';

/**
 * Handlers already verified per request. `@Recaptcha()` on both a class and a method applies the guard twice:
 * the second run must not re-send the token (Google would answer `timeout-or-duplicate`).
 * Keyed by handler, not just by request: in GraphQL one request may run several resolvers with different options.
 * Module scope: the runs may be served by different guard instances.
 */
const verifiedHandlers = new WeakMap<RecaptchaRequest, Set<unknown>>();

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
		const handler = context.getHandler();

		// Both runs see the same merged class + handler options, so the first successful result applies.
		if (verifiedHandlers.get(request)?.has(handler)) {
			return true;
		}

		const skipIfValue = this.configRef.valueOf.skipIf;
		const skip = typeof skipIfValue === 'function' ? await skipIfValue(request) : !!skipIfValue;

		if (skip) {
			return true;
		}

		if (!this.configRef.isConfigured) {
			if (this.configRef.whenNotConfigured === 'skip') {
				return true;
			}

			throw new GoogleRecaptchaException([ErrorCode.NotConfigured]);
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
			safeDebug(this.logger, result.toObject(), `${validator.logContext}.result`);
		}

		if (result.success) {
			const handlers = verifiedHandlers.get(request) ?? new Set<unknown>();
			handlers.add(handler);
			verifiedHandlers.set(request, handlers);

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

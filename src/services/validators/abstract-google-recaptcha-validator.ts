import { Logger } from '@nestjs/common';
import { AxiosInstance, AxiosRequestConfig } from 'axios';
import { VerifyResponseOptions } from '../../interfaces/verify-response-decorator-options.js';
import { ScoreValidator } from '../../types.js';
import { RecaptchaVerificationResult } from '../../models/recaptcha-verification-result.js';
import { RecaptchaConfigRef } from '../../models/recaptcha-config-ref.js';
import { GoogleRecaptchaContext } from '../../enums/google-recaptcha-context.js';
import { GoogleRecaptchaNetworkException } from '../../exceptions/google-recaptcha-network.exception.js';
import { getErrorInfo, isAxiosError } from '../../helpers/get-error-info.js';
import { GoogleRecaptchaException } from '../../exceptions/google-recaptcha.exception.js';
import { ErrorCode } from '../../enums/error-code.js';

export interface PostError {
	status?: number;
	data: unknown;
}

export type PostResult<T> = { data: T; error?: undefined } | { data?: undefined; error: PostError };

export abstract class AbstractGoogleRecaptchaValidator<Res> {
	/** Prefix for debug log messages: `<logContext>.request`, `<logContext>.response`, etc. */
	abstract readonly logContext: GoogleRecaptchaContext;

	protected constructor(
		protected readonly axios: AxiosInstance,
		protected readonly logger: Logger,
		protected readonly options: RecaptchaConfigRef
	) {}

	abstract validate(options: VerifyResponseOptions): Promise<RecaptchaVerificationResult<Res>>;

	/**
	 * Sends a request to the verification API with debug logging.
	 * HTTP errors are returned as `error`; network errors (no response) are thrown.
	 *
	 * @param url
	 * @param body
	 * @param config
	 * @param loggedBody what to log instead of `body` (e.g. with masked secrets)
	 * @throws GoogleRecaptchaNetworkException
	 */
	protected async post<T>(url: string, body: unknown, config: AxiosRequestConfig, loggedBody: unknown = body): Promise<PostResult<T>> {
		this.debug({ body: loggedBody }, 'request');

		try {
			const { data } = await this.axios.post<T>(url, body, config);
			this.debug(data, 'response');

			return { data };
		} catch (err) {
			this.debug(getErrorInfo(err), 'error');

			if (isAxiosError(err) && !err.response && err.code) {
				throw new GoogleRecaptchaNetworkException(err.code);
			}

			// Not only axios errors can get here (e.g. an exception thrown by the logger).
			const response = isAxiosError(err) ? err.response : undefined;

			return {
				error: {
					status: response?.status,
					data: response?.data ?? getErrorInfo(err),
				},
			};
		}
	}

	/** @throws GoogleRecaptchaException (`not-configured`) while keys are not set (`forRootDeferred()`, `RecaptchaConfigRef.clear()`). */
	protected assertConfigured(): void | never {
		if (!this.options.isConfigured) {
			throw new GoogleRecaptchaException([ErrorCode.NotConfigured]);
		}
	}

	protected debug(message: unknown, event: string): void {
		if (this.options.valueOf.debug) {
			this.logger.debug(message, `${this.logContext}.${event}`);
		}
	}

	/** Missing action (e.g. not returned by Google) is valid only when no action restrictions are configured. */
	protected isValidAction(action: string | undefined, options: VerifyResponseOptions): boolean {
		if (options.action) {
			return options.action === action;
		}

		const actions = this.options.valueOf.actions;

		if (!actions) {
			return true;
		}

		return action !== undefined && actions.includes(action);
	}

	/** Missing score (e.g. not returned by Google) is valid only when no score validator is configured. */
	protected isValidScore(score: number | undefined, validator?: ScoreValidator): boolean {
		const finalValidator = validator ?? this.options.valueOf.score;

		if (finalValidator == null) {
			return true;
		}

		if (score === undefined) {
			return false;
		}

		return typeof finalValidator === 'function' ? finalValidator(score) : score >= finalValidator;
	}
}

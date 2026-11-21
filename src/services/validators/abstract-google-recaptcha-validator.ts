import { Logger } from '@nestjs/common';
import { AxiosInstance, AxiosRequestConfig } from 'axios';
import { VerifyResponseOptions } from '../../interfaces/verify-response-decorator-options';
import { ScoreValidator } from '../../types';
import { RecaptchaVerificationResult } from '../../models/recaptcha-verification-result';
import { RecaptchaConfigRef } from '../../models/recaptcha-config-ref';
import { GoogleRecaptchaContext } from '../../enums/google-recaptcha-context';
import { GoogleRecaptchaNetworkException } from '../../exceptions/google-recaptcha-network.exception';
import { getErrorInfo, isAxiosError } from '../../helpers/get-error-info';

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

	protected debug(message: unknown, event: string): void {
		if (this.options.valueOf.debug) {
			this.logger.debug(message, `${this.logContext}.${event}`);
		}
	}

	protected isValidAction(action: string, options: VerifyResponseOptions): boolean {
		if (options.action) {
			return options.action === action;
		}

		return this.options.valueOf.actions ? this.options.valueOf.actions.includes(action) : true;
	}

	protected isValidScore(score: number, validator?: ScoreValidator): boolean {
		const finalValidator = validator ?? this.options.valueOf.score;

		if (finalValidator != null) {
			if (typeof finalValidator === 'function') {
				return finalValidator(score);
			}

			return score >= finalValidator;
		}

		return true;
	}
}

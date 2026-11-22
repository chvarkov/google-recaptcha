import { Inject, Injectable, Logger } from '@nestjs/common';
import { RECAPTCHA_AXIOS_INSTANCE, RECAPTCHA_LOGGER } from '../../provider.declarations';
import { GoogleRecaptchaSiteVerifyUrl } from '../../enums/google-recaptcha-site-verify-url';
import { VerifyResponseOptions } from '../../interfaces/verify-response-decorator-options';
import { VerifyResponseV2, VerifyResponseV3 } from '../../interfaces/verify-response';
import { ErrorCode } from '../../enums/error-code';
import { AbstractGoogleRecaptchaValidator } from './abstract-google-recaptcha-validator';
import { RecaptchaVerificationResult } from '../../models/recaptcha-verification-result';
import { GoogleRecaptchaContext } from '../../enums/google-recaptcha-context';
import { maskSecret } from '../../helpers/mask-secret';
import { AxiosInstance } from 'axios';
import { RecaptchaConfigRef } from '../../models/recaptcha-config-ref';

/** Raw siteverify response: Google returns errors as `error-codes`. */
type SiteVerifyResponse = Omit<VerifyResponseV3, 'errors'> & { 'error-codes'?: ErrorCode[] };

@Injectable()
export class GoogleRecaptchaValidator extends AbstractGoogleRecaptchaValidator<VerifyResponseV3> {
	private readonly defaultSiteVerifyUrl = GoogleRecaptchaSiteVerifyUrl.Google;

	private readonly headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

	readonly logContext = GoogleRecaptchaContext.GoogleRecaptcha;

	constructor(
		@Inject(RECAPTCHA_AXIOS_INSTANCE) axios: AxiosInstance,
		@Inject(RECAPTCHA_LOGGER) logger: Logger,
		configRef: RecaptchaConfigRef
	) {
		super(axios, logger, configRef);
	}

	/**
	 * @throws GoogleRecaptchaNetworkException
	 * @param {VerifyResponseOptions} options
	 */
	async validate(options: VerifyResponseOptions): Promise<RecaptchaVerificationResult<VerifyResponseV3>> {
		const isV3 = this.options.valueOf.type === 'v3';

		// v2 response has neither score nor action: silently skipping a check expected by the caller is unsafe.
		if (!isV3 && (options.action != null || options.score != null)) {
			throw new Error('Google reCAPTCHA v2 does not support "score" and "action" checks.');
		}

		// v2 responses do not contain score/action: fields stay undefined.
		const result = (await this.verifyResponse(options.response, options.remoteIp)) as Partial<VerifyResponseV3> & VerifyResponseV2;

		// Score and action are checked only when Google has confirmed the token; otherwise Google's error codes are returned as is.
		if (isV3 && result.success) {
			if (!this.isValidAction(result.action, options)) {
				result.success = false;
				result.errors.push(ErrorCode.ForbiddenAction);
			}

			if (!this.isValidScore(result.score, options.score)) {
				result.success = false;
				result.errors.push(ErrorCode.LowScore);
			}
		}

		return new RecaptchaVerificationResult({
			nativeResponse: { ...result } as VerifyResponseV3,
			remoteIp: options.remoteIp,
			score: result.score,
			action: result.action,
			errors: result.errors,
			success: result.success,
			hostname: result.hostname,
		});
	}

	private async verifyResponse(response: string | undefined, remoteIp?: string): Promise<VerifyResponseV2 | VerifyResponseV3> {
		const secretKey = this.options.valueOf.secretKey;
		const body = new URLSearchParams({ secret: secretKey ?? '', response: response ?? '' });

		if (remoteIp) {
			body.append('remoteip', remoteIp);
		}

		const url = this.options.valueOf.siteVerifyUrl || this.defaultSiteVerifyUrl;

		// Secret key must never be logged in plain text.
		const loggedBody = { secret: maskSecret(secretKey), response, remoteip: remoteIp };

		const { data, error } = await this.post<SiteVerifyResponse | null>(url, body, { headers: this.headers }, loggedBody);

		// Empty body is treated as an error too (previously failed with TypeError inside the promise chain).
		if (error || !data) {
			// No response from Google: hostname/challenge_ts are unknown.
			return { success: false, errors: [ErrorCode.UnknownError] } as unknown as VerifyResponseV2;
		}

		const { 'error-codes': errorCodes, ...result } = data;

		return { ...result, errors: errorCodes || [] };
	}
}

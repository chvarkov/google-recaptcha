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
		const result = await this.verifyResponse(options.response, options.remoteIp);

		if (!this.isUseV3(result)) {
			const resV2: VerifyResponseV2 = result;
			return new RecaptchaVerificationResult({
				nativeResponse: resV2 as VerifyResponseV3,
				remoteIp: options.remoteIp,
				score: undefined,
				action: undefined,
				errors: resV2.errors,
				success: resV2.success,
				hostname: resV2.hostname,
			});
		}

		if (!this.isValidAction(result.action, options)) {
			result.success = false;
			result.errors.push(ErrorCode.ForbiddenAction);
		}

		if (!this.isValidScore(result.score, options.score)) {
			result.success = false;
			result.errors.push(ErrorCode.LowScore);
		}

		const nativeResponse = { ...result };

		return new RecaptchaVerificationResult({
			nativeResponse: nativeResponse,
			remoteIp: options.remoteIp,
			score: result.score,
			errors: result.errors,
			success: result.success,
			action: result.action,
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

	private isUseV3(v: VerifyResponseV2): v is VerifyResponseV3 {
		return 'score' in v && typeof v['score'] === 'number' && 'action' in v && typeof v['action'] === 'string';
	}
}

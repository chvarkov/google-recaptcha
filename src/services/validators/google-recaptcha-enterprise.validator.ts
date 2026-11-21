import { Inject, Injectable, Logger } from '@nestjs/common';
import { RECAPTCHA_AXIOS_INSTANCE, RECAPTCHA_LOGGER } from '../../provider.declarations';
import { VerifyResponseOptions } from '../../interfaces/verify-response-decorator-options';
import { AbstractGoogleRecaptchaValidator, PostResult } from './abstract-google-recaptcha-validator';
import { RecaptchaVerificationResult } from '../../models/recaptcha-verification-result';
import { ErrorCode } from '../../enums/error-code';
import { GoogleRecaptchaContext } from '../../enums/google-recaptcha-context';
import { VerifyResponseEnterprise, VerifyTokenEnterpriseEvent } from '../../interfaces/verify-response-enterprise';
import { EnterpriseReasonTransformer } from '../enterprise-reason.transformer';
import { AxiosInstance } from 'axios';
import { RecaptchaConfigRef } from '../../models/recaptcha-config-ref';

@Injectable()
export class GoogleRecaptchaEnterpriseValidator extends AbstractGoogleRecaptchaValidator<VerifyResponseEnterprise> {
	private readonly headers = { 'Content-Type': 'application/json' };

	readonly logContext = GoogleRecaptchaContext.GoogleRecaptchaEnterprise;

	constructor(
		@Inject(RECAPTCHA_AXIOS_INSTANCE) axios: AxiosInstance,
		@Inject(RECAPTCHA_LOGGER) logger: Logger,
		configRef: RecaptchaConfigRef,
		private readonly enterpriseReasonTransformer: EnterpriseReasonTransformer
	) {
		super(axios, logger, configRef);
	}

	async validate(options: VerifyResponseOptions): Promise<RecaptchaVerificationResult<VerifyResponseEnterprise>> {
		const { data: result, error } = await this.verifyResponse(options.response, options.action, options.remoteIp);

		const errors: ErrorCode[] = [];
		let success = result?.tokenProperties?.valid || false;

		if (!error) {
			if (result.tokenProperties) {
				if (result.tokenProperties.invalidReason) {
					const invalidReasonCode = this.enterpriseReasonTransformer.transform(result.tokenProperties.invalidReason);

					if (invalidReasonCode) {
						errors.push(invalidReasonCode);
					}
				}

				if (success && !this.isValidAction(result.tokenProperties.action, options)) {
					success = false;
					errors.push(ErrorCode.ForbiddenAction);
				}
			}

			if (result.riskAnalysis && !this.isValidScore(result.riskAnalysis.score, options.score)) {
				success = false;
				errors.push(ErrorCode.LowScore);
			}
		}

		if (!success && !errors.length) {
			errors.push(error ? ErrorCode.UnknownError : ErrorCode.InvalidInputResponse);
		}

		return new RecaptchaVerificationResult({
			success,
			errors,
			// On HTTP error there is no response from Google.
			nativeResponse: result as VerifyResponseEnterprise,
			remoteIp: options.remoteIp,
			score: result?.riskAnalysis?.score,
			action: result?.tokenProperties?.action,
			hostname: result?.tokenProperties?.hostname || '',
		});
	}

	private async verifyResponse(
		response: string | undefined,
		expectedAction?: string,
		remoteIp?: string
	): Promise<PostResult<VerifyResponseEnterprise>> {
		const enterprise = this.options.valueOf.enterprise;

		if (!enterprise) {
			throw new Error('Google reCAPTCHA Enterprise options are not configured.');
		}

		const { projectId, siteKey, apiKey } = enterprise;

		const body: { event: VerifyTokenEnterpriseEvent } = {
			event: {
				expectedAction,
				siteKey,
				token: response ?? '',
				userIpAddress: remoteIp,
			},
		};

		const url = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments`;

		return this.post<VerifyResponseEnterprise>(url, body, {
			headers: this.headers,
			params: { key: apiKey },
		});
	}
}

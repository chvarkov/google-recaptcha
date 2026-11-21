import { Inject, Injectable, Logger } from '@nestjs/common';
import { RECAPTCHA_AXIOS_INSTANCE, RECAPTCHA_LOGGER } from '../../provider.declarations';
import { VerifyResponseOptions } from '../../interfaces/verify-response-decorator-options';
import { AbstractGoogleRecaptchaValidator } from './abstract-google-recaptcha-validator';
import { RecaptchaVerificationResult } from '../../models/recaptcha-verification-result';
import { ErrorCode } from '../../enums/error-code';
import { GoogleRecaptchaContext } from '../../enums/google-recaptcha-context';
import { VerifyResponseEnterprise, VerifyTokenEnterpriseEvent } from '../../interfaces/verify-response-enterprise';
import { EnterpriseReasonTransformer } from '../enterprise-reason.transformer';
import { AxiosInstance } from 'axios';
import { LiteralObject } from '../../interfaces/literal-object';
import { RecaptchaConfigRef } from '../../models/recaptcha-config-ref';

type VerifyResponse = [VerifyResponseEnterprise, LiteralObject];

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
		const [result, errorDetails] = await this.verifyResponse(options.response, options.action, options.remoteIp);

		const errors: ErrorCode[] = [];
		let success = result?.tokenProperties?.valid || false;

		if (!errorDetails) {
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
			errors.push(errorDetails ? ErrorCode.UnknownError : ErrorCode.InvalidInputResponse);
		}

		return new RecaptchaVerificationResult({
			success,
			errors,
			nativeResponse: result,
			remoteIp: options.remoteIp,
			score: result?.riskAnalysis?.score,
			action: result?.tokenProperties?.action,
			hostname: result?.tokenProperties?.hostname || '',
		});
	}

	private async verifyResponse(response: string, expectedAction: string, remoteIp: string): Promise<VerifyResponse> {
		const { projectId, siteKey, apiKey } = this.options.valueOf.enterprise;

		const body: { event: VerifyTokenEnterpriseEvent } = {
			event: {
				expectedAction,
				siteKey,
				token: response,
				userIpAddress: remoteIp,
			},
		};

		const url = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments`;

		const { data, error } = await this.post<VerifyResponseEnterprise>(url, body, {
			headers: this.headers,
			params: { key: apiKey },
		});

		return error ? [null, error] : [data, null];
	}
}

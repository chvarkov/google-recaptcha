import { Inject, Injectable, Logger } from '@nestjs/common';
import { RECAPTCHA_AXIOS_INSTANCE, RECAPTCHA_LOGGER } from '../../provider.declarations';
import { VerifyResponseOptions } from '../../interfaces/verify-response-decorator-options';
import { AbstractGoogleRecaptchaValidator } from './abstract-google-recaptcha-validator';
import { RecaptchaVerificationResult } from '../../models/recaptcha-verification-result';
import { ErrorCode } from '../../enums/error-code';
import * as axios from 'axios';
import { GoogleRecaptchaNetworkException } from '../../exceptions/google-recaptcha-network.exception';
import { GoogleRecaptchaContext } from '../../enums/google-recaptcha-context';
import { VerifyResponseEnterprise, VerifyTokenEnterpriseEvent } from '../../interfaces/verify-response-enterprise';
import { EnterpriseReasonTransformer } from '../enterprise-reason.transformer';
import { getErrorInfo } from '../../helpers/get-error-info';
import { AxiosInstance } from 'axios';
import { LiteralObject } from '../../interfaces/literal-object';
import { RecaptchaConfigRef } from '../../models/recaptcha-config-ref';

type VerifyResponse = [VerifyResponseEnterprise, LiteralObject];

@Injectable()
export class GoogleRecaptchaEnterpriseValidator extends AbstractGoogleRecaptchaValidator<VerifyResponseEnterprise> {
	private readonly headers = { 'Content-Type': 'application/json' };

	constructor(
		@Inject(RECAPTCHA_AXIOS_INSTANCE) private readonly axios: AxiosInstance,
		@Inject(RECAPTCHA_LOGGER) private readonly logger: Logger,
		configRef: RecaptchaConfigRef,
		private readonly enterpriseReasonTransformer: EnterpriseReasonTransformer
	) {
		super(configRef);
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
			errorDetails ? errors.push(ErrorCode.UnknownError) : errors.push(ErrorCode.InvalidInputResponse);
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

	private verifyResponse(response: string, expectedAction: string, remoteIp: string): Promise<VerifyResponse> {
		const projectId = this.options.valueOf.enterprise.projectId;
		const body: { event: VerifyTokenEnterpriseEvent } = {
			event: {
				expectedAction,
				siteKey: this.options.valueOf.enterprise.siteKey,
				token: response,
				userIpAddress: remoteIp,
			},
		};

		const url = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments`;

		const config: axios.AxiosRequestConfig = {
			headers: this.headers,
			params: {
				key: this.options.valueOf.enterprise.apiKey,
			},
		};

		if (this.options.valueOf.debug) {
			this.logger.debug({ body }, `${GoogleRecaptchaContext.GoogleRecaptchaEnterprise}.request`);
		}

		return this.axios.post<VerifyResponseEnterprise>(url, body, config)
			.then((res) => res.data)
			.then((data: VerifyResponseEnterprise): VerifyResponse => {
				if (this.options.valueOf.debug) {
					this.logger.debug(data, `${GoogleRecaptchaContext.GoogleRecaptchaEnterprise}.response`);
				}

				return [data, null];
			})
			.catch((err: axios.AxiosError): VerifyResponse => {
				if (this.options.valueOf.debug) {
					this.logger.debug(getErrorInfo(err), `${GoogleRecaptchaContext.GoogleRecaptchaEnterprise}.error`);
				}

				const networkErrorCode = err.isAxiosError && !err.response && err.code;

				if (networkErrorCode) {
					throw new GoogleRecaptchaNetworkException(networkErrorCode);
				}

				const errData: LiteralObject = {
					status: err.response.status,
					data: err.response.data,
				};

				return [null, errData];
			});
	}
}

import { Inject, Injectable, Logger } from '@nestjs/common';
import { RECAPTCHA_HTTP_SERVICE, RECAPTCHA_LOGGER, RECAPTCHA_OPTIONS } from '../../provider.declarations';
import { HttpService } from '@nestjs/axios';
import { GoogleRecaptchaModuleOptions } from '../../interfaces/google-recaptcha-module-options';
import { VerifyResponseOptions } from '../../interfaces/verify-response-decorator-options';
import { AbstractGoogleRecaptchaValidator } from './abstract-google-recaptcha-validator';
import { RecaptchaVerificationResult } from '../../models/recaptcha-verification-result';
import { ErrorCode } from '../../enums/error-code';
import * as axios from 'axios';
import { GoogleRecaptchaNetworkException } from '../../exceptions/google-recaptcha-network.exception';
import { GoogleRecaptchaContext } from '../../enums/google-recaptcha-context';
import { VerifyResponseEnterprise, VerifyTokenEnterpriseEvent } from '../../interfaces/verify-response-enterprise';
import { EnterpriseReasonTransformer } from '../enterprise-reason.transformer';

@Injectable()
export class GoogleRecaptchaEnterpriseValidator extends AbstractGoogleRecaptchaValidator {
    private readonly headers = {'Content-Type': 'application/json'};

    constructor(@Inject(RECAPTCHA_HTTP_SERVICE) private readonly http: HttpService,
                @Inject(RECAPTCHA_LOGGER) private readonly logger: Logger,
                @Inject(RECAPTCHA_OPTIONS) options: GoogleRecaptchaModuleOptions,
                private readonly enterpriseReasonTransformer: EnterpriseReasonTransformer) {
        super(options);
    }

    async validate(options: VerifyResponseOptions): Promise<RecaptchaVerificationResult> {
        const [result, errorDetails] = await this.verifyResponse(options.response, options.action);

        const errors: ErrorCode[] = [];
        let success = result.tokenProperties.valid;

        if (result.tokenProperties.invalidReason) {
            errors.push(this.enterpriseReasonTransformer.transform(result.tokenProperties.invalidReason));
        }

        if (errorDetails) {
            errors.push(ErrorCode.UnknownError);
        }

        if (!result) {
            if (!this.isValidAction(result.tokenProperties.action, options)) {
                success = false;
                errors.push(ErrorCode.ForbiddenAction);
            }

            if (!this.isValidScore(result.riskAnalysis.score, options.score)) {
                success = false;
                errors.push(ErrorCode.LowScore);
            }
        }

        return new RecaptchaVerificationResult({
            success,
            errors,
            nativeResponse: result || errorDetails,
            score: result?.riskAnalysis?.score,
            action: result?.tokenProperties?.action,
            hostname: result?.tokenProperties?.hostname || '',
        });
    }

    private verifyResponse(response: string, expectedAction: string): Promise<[VerifyResponseEnterprise | null, any]> {
        const projectId = this.options.enterprise.projectId;
        const body: {event: VerifyTokenEnterpriseEvent} = {
            event: {
                expectedAction,
                siteKey: this.options.enterprise.siteKey,
                token: response,
            },
        };

        const url = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments`;

        const config: axios.AxiosRequestConfig = {
            headers: this.headers,
            params: {
                key: this.options.enterprise.apiKey,
            },
        };

        if (this.options.debug) {
            this.logger.debug({body}, `${GoogleRecaptchaContext.GoogleRecaptchaEnterprise}.request`);
        }

        return this.http.post<VerifyResponseEnterprise>(url, body, config)
            .toPromise()
            .then(res => res.data)
            .then(data => {
                if (this.options.debug) {
                    this.logger.debug(data, `${GoogleRecaptchaContext.GoogleRecaptchaEnterprise}.response`);
                }

                return [data, null];
            })
            .catch((err: axios.AxiosError) => {
                if (this.options.debug) {
                    this.logger.debug(
                        err?.response?.data || err.code || {error: `${err?.name}: ${err?.message}`, stack: err?.stack},
                        `${GoogleRecaptchaContext.GoogleRecaptchaEnterprise}.error`,
                    );
                }

                const networkErrorCode = err.isAxiosError && err.code;

                if (networkErrorCode) {
                    throw new GoogleRecaptchaNetworkException(networkErrorCode);
                }

                const errData = err.response?.data;

                return [null, errData] as any;
            });
    }
}

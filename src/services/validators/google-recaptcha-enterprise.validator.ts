import { Inject, Injectable, LiteralObject, Logger } from '@nestjs/common';
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
import { firstValueFrom } from 'rxjs';
import { getErrorInfo } from '../../helpers/get-error-info';

type VerifyResponse = [VerifyResponseEnterprise, LiteralObject];

@Injectable()
export class GoogleRecaptchaEnterpriseValidator extends AbstractGoogleRecaptchaValidator<VerifyResponseEnterprise> {
    private readonly headers = {'Content-Type': 'application/json'};

    constructor(@Inject(RECAPTCHA_HTTP_SERVICE) private readonly http: HttpService,
                @Inject(RECAPTCHA_LOGGER) private readonly logger: Logger,
                @Inject(RECAPTCHA_OPTIONS) options: GoogleRecaptchaModuleOptions,
                private readonly enterpriseReasonTransformer: EnterpriseReasonTransformer) {
        super(options);
    }

    async validate(options: VerifyResponseOptions): Promise<RecaptchaVerificationResult<VerifyResponseEnterprise>> {
        const [result, errorDetails] = await this.verifyResponse(options.response, options.action);

        const errors: ErrorCode[] = [];
        let success = result?.tokenProperties.valid || false;

        if (errorDetails) {
            errors.push(ErrorCode.UnknownError);
        }

        if (result) {
            if (result.tokenProperties.invalidReason) {
                errors.push(this.enterpriseReasonTransformer.transform(result.tokenProperties.invalidReason));
            }

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
            nativeResponse: result,
            score: result?.riskAnalysis?.score,
            action: result?.tokenProperties?.action,
            hostname: result?.tokenProperties?.hostname || '',
        });
    }

    private verifyResponse(response: string, expectedAction: string): Promise<VerifyResponse> {
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

        return firstValueFrom(this.http.post<VerifyResponseEnterprise>(url, body, config))
            .then(res => res.data)
            .then((data): VerifyResponse => {
                if (this.options.debug) {
                    this.logger.debug(data, `${GoogleRecaptchaContext.GoogleRecaptchaEnterprise}.response`);
                }

                return [data, null];
            })
            .catch((err: axios.AxiosError): VerifyResponse => {
                if (this.options.debug) {
                    this.logger.debug(getErrorInfo(err), `${GoogleRecaptchaContext.GoogleRecaptchaEnterprise}.error`);
                }

                const networkErrorCode = err.isAxiosError && err.code;

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

import { Inject, Injectable, Logger } from '@nestjs/common';
import { RECAPTCHA_HTTP_SERVICE, RECAPTCHA_LOGGER, RECAPTCHA_OPTIONS } from '../../provider.declarations';
import * as qs from 'querystring';
import * as axios from 'axios';
import { GoogleRecaptchaNetwork } from '../../enums/google-recaptcha-network';
import { VerifyResponseOptions } from '../../interfaces/verify-response-decorator-options';
import { VerifyResponseV2, VerifyResponseV3 } from '../../interfaces/verify-response';
import { ErrorCode } from '../../enums/error-code';
import { GoogleRecaptchaNetworkException } from '../../exceptions/google-recaptcha-network.exception';
import { HttpService } from "@nestjs/axios";
import { GoogleRecaptchaModuleOptions } from '../../interfaces/google-recaptcha-module-options';
import { AbstractGoogleRecaptchaValidator } from './abstract-google-recaptcha-validator';
import { RecaptchaVerificationResult } from '../../models/recaptcha-verification-result';
import { GoogleRecaptchaContext } from '../../enums/google-recaptcha-context';

@Injectable()
export class GoogleRecaptchaValidator extends AbstractGoogleRecaptchaValidator<VerifyResponseV3> {
    private readonly defaultNetwork = GoogleRecaptchaNetwork.Google;

    private readonly headers = {'Content-Type': 'application/x-www-form-urlencoded'};

    constructor(@Inject(RECAPTCHA_HTTP_SERVICE) private readonly http: HttpService,
                @Inject(RECAPTCHA_LOGGER) private readonly logger: Logger,
                @Inject(RECAPTCHA_OPTIONS) options: GoogleRecaptchaModuleOptions) {
        super(options);
    }

    /**
     * @throws GoogleRecaptchaNetworkException
     * @param {VerifyResponseOptions} options
     */
    async validate(options: VerifyResponseOptions): Promise<RecaptchaVerificationResult<VerifyResponseV3>> {
        const result = await this.verifyResponse<VerifyResponseV3>(options.response);

        const nativeResponse = {...result};

        if (!this.isUseV3(result)) {
            return result;
        }

        if (!this.isValidAction(result.action, options)) {
            result.success = false;
            result.errors.push(ErrorCode.ForbiddenAction);
        }

        if (!this.isValidScore(result.score, options.score)) {
            result.success = false;
            result.errors.push(ErrorCode.LowScore);
        }

        return new RecaptchaVerificationResult({
            nativeResponse: nativeResponse,
            score: result.score,
            errors: result.errors,
            success: result.success,
            action: result.action,
            hostname: result.hostname,
        });
    }

    private verifyResponse<T extends VerifyResponseV2>(response: string): Promise<T> {
        const body = qs.stringify({secret: this.options.secretKey, response});
        const url = this.options.network || this.defaultNetwork;

        const config: axios.AxiosRequestConfig = {
            headers: this.headers,
        };

        if (this.options.debug) {
            this.logger.debug({body}, `${GoogleRecaptchaContext.GoogleRecaptcha}.request`);
        }

        return this.http.post(url, body, config)
            .toPromise()
            .then(res => res.data)
            .then(data => {
                if (this.options.debug) {
                    this.logger.debug(data, `${GoogleRecaptchaContext.GoogleRecaptcha}.response`);
                }

                return data;
            })
            .then(result => ({
                ...result,
                errors: result['error-codes'] || [],
            }))
            .then(result => {
                delete result['error-codes'];
                return result;
            })
            .catch((err: axios.AxiosError) => {
                if (this.options.debug) {
                    this.logger.debug(
                        err?.response?.data || err.code || {error: `${err?.name}: ${err?.message}`, stack: err?.stack},
                        `${GoogleRecaptchaContext.GoogleRecaptcha}.error`,
                    );
                }

                const networkErrorCode = err.isAxiosError && err.code;

                if (networkErrorCode) {
                    throw new GoogleRecaptchaNetworkException(networkErrorCode);
                }

                return {
                    success: false,
                    errors: [ErrorCode.UnknownError],
                };
            });
    }

    private isUseV3(v: VerifyResponseV2): v is VerifyResponseV3 {
        return ('score' in v && typeof v['score'] === 'number') &&
            ('action' in v && typeof v['action'] === 'string');
    }
}

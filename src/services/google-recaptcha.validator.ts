import { HttpService, Inject, Injectable } from '@nestjs/common';
import { GoogleRecaptchaValidatorOptions } from '../interfaces/google-recaptcha-validator-options';
import { RECAPTCHA_OPTIONS } from '../provider.declarations';
import * as qs from 'querystring';
import { GoogleRecaptchaValidationResult } from '../interfaces/google-recaptcha-validation-result';
import { GoogleRecaptchaNetwork } from '../enums/google-recaptcha-network';
import { ScoreValidator } from '../types';
import { VerifyResponseOptions } from '../interfaces/verify-response-decorator-options';
import { VerifyResponseV2, VerifyResponseV3 } from '../interfaces/verify-response';
import { ErrorCode } from '../enums/error-code';

@Injectable()
export class GoogleRecaptchaValidator {
    private readonly defaultNetwork = GoogleRecaptchaNetwork.Google;
    private readonly headers = {'Content-Type': 'application/x-www-form-urlencoded'};

    constructor(private readonly http: HttpService,
                @Inject(RECAPTCHA_OPTIONS) private readonly options: GoogleRecaptchaValidatorOptions) {
    }

    async validate(options: VerifyResponseOptions): Promise<GoogleRecaptchaValidationResult> {
        const result = await this.verifyResponse<VerifyResponseV3>(options.response);

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

        return result;
    }

    private verifyResponse<T extends VerifyResponseV2>(response: string): Promise<T> {
        const data = qs.stringify({secret: this.options.secretKey, response});
        const url = this.options.network || this.defaultNetwork;

        return this.http.post(url, data, {
            headers: this.headers,
            httpsAgent: this.options.agent
        })
            .toPromise()
            .then(res => res.data)
            .then(result => ({
                ...result,
                errors: result['error-codes'] || [],
            }))
            .then(result => {
                delete result['error-codes'];
                return result;
            })
            .catch(() => ({
                success: false,
                errors: [ErrorCode.UnknownError],
            }))
    }

    private isValidAction(action: string, options?: VerifyResponseOptions): boolean {
        if (options.action) {
            return options.action === action;
        }

        return this.options.actions
            ? this.options.actions.includes(action)
            : true;
    }

    private isValidScore(score: number, validator?: ScoreValidator): boolean {
        const finalValidator = validator || this.options.score;

        if (finalValidator) {
            if (typeof finalValidator === 'function') {
                return finalValidator(score);
            }

            return score >= finalValidator;
        }

        return true;
    }

    private isUseV3(v: VerifyResponseV2): v is VerifyResponseV3 {
        return ('score' in v && typeof v['score'] === 'number') &&
            ('action' in v && typeof v['action'] === 'string');
    }
}

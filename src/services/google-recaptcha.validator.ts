import { HttpService, Inject, Injectable } from '@nestjs/common';
import { GoogleRecaptchaValidatorOptions } from '../interfaces/google-recaptcha-validator-options';
import { RECAPTCHA_OPTIONS } from '../provider.declarations';
import * as qs from 'querystring';
import { GoogleRecaptchaValidationResult } from '../interfaces/google-recaptcha-validation-result';
import { ErrorCode } from '../enums/error-code';

@Injectable()
export class GoogleRecaptchaValidator {
    private readonly apiUrl = 'https://www.google.com/recaptcha/api/siteverify';
    private readonly apiUrlUseRecaptchaNet = 'https://recaptcha.net/recaptcha/api/siteverify';
    private readonly headers = {'Content-Type': 'application/x-www-form-urlencoded'};

    constructor(private readonly http: HttpService,
                @Inject(RECAPTCHA_OPTIONS) private readonly options: GoogleRecaptchaValidatorOptions) {
    }

    validate(response: string): Promise<GoogleRecaptchaValidationResult> {
        const data = qs.stringify({secret: this.options.secretKey, response});

        return this.http.post(
            this.options.useRecaptchaNet ? this.apiUrlUseRecaptchaNet : this.apiUrl, data, {
                headers: this.headers,
                httpsAgent: this.options.agent
            }
        )
            .toPromise()
            .then(res => res.data)
            .then(result => ({
                success: result.success,
                errors: result['error-codes'] || [],
            }))
            .catch(() => ({
                success: false,
                errors: [ErrorCode.UnknownError],
            }));
    }
}

import { HttpService, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleRecaptchaValidatorOptions } from '../interfaces/google-recaptcha-validator-options';
import { RECAPTCHA_OPTIONS } from '../provider.declarations';
import * as qs from 'querystring';

@Injectable()
export class GoogleRecaptchaValidator {
    private readonly apiUrl = 'https://www.google.com/recaptcha/api/siteverify';
    private readonly headers = {'Content-Type': 'application/x-www-form-urlencoded'};

    constructor(private readonly http: HttpService,
                @Inject(RECAPTCHA_OPTIONS) private readonly options: GoogleRecaptchaValidatorOptions) {
    }

    validate(response: string): Promise<boolean> {
        const data = qs.stringify({secret: this.options.secretKey, response});

        return this.http.post(this.apiUrl, data, {headers: this.headers})
            .toPromise()
            .then(res => res.data)
            .then(result => result.success)
            .catch(() => {
                if (this.options.onError) {
                    return this.options.onError();
                }

                throw new InternalServerErrorException('Failed recaptcha verification.');
            });
    }
}

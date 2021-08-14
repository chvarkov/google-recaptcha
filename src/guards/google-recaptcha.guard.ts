import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { GoogleRecaptchaValidator } from '../services/google-recaptcha.validator';
import { GoogleRecaptchaGuardOptions } from '../interfaces/google-recaptcha-guard-options';
import { RECAPTCHA_OPTIONS, RECAPTCHA_VALIDATION_OPTIONS } from '../provider.declarations';
import { GoogleRecaptchaException } from '../exceptions/google-recaptcha.exception';
import { Reflector } from '@nestjs/core';
import { RecaptchaRequestResolver } from '../services/recaptcha-request.resolver';
import { VerifyResponseDecoratorOptions } from '../interfaces/verify-response-decorator-options';

@Injectable()
export class GoogleRecaptchaGuard implements CanActivate {
    constructor(private readonly validator: GoogleRecaptchaValidator,
                private readonly reflector: Reflector,
                private readonly requestResolver: RecaptchaRequestResolver,
                @Inject(RECAPTCHA_OPTIONS) private readonly options: GoogleRecaptchaGuardOptions) {
    }

    async canActivate(context: ExecutionContext): Promise<true | never> {
        const request = this.options.applicationType
            ? this.requestResolver.resolveByApplicationType(context, this.options.applicationType)
            : this.requestResolver.resolve(context);

        const skip = typeof this.options.skipIf === 'function'
            ? await this.options.skipIf(request)
            : !!this.options.skipIf;

        if (skip) {
            return true;
        }

        const options: VerifyResponseDecoratorOptions = this.reflector.get(RECAPTCHA_VALIDATION_OPTIONS, context.getHandler());

        const response = options?.response
            ? await options?.response(request)
            : await this.options.response(request);

        const score = options?.score || this.options.score;
        const action = options?.action;

        request.recaptchaValidationResult = await this.validator.validate({response, score, action});

        if (request.recaptchaValidationResult.success) {
            return true;
        }

        throw new GoogleRecaptchaException(request.recaptchaValidationResult.errors);
    }
}

import { CanActivate, ExecutionContext, Inject, Injectable, Logger } from '@nestjs/common';
import { GoogleRecaptchaValidator } from '../services/google-recaptcha.validator';
import { RECAPTCHA_LOGGER, RECAPTCHA_OPTIONS, RECAPTCHA_VALIDATION_OPTIONS } from '../provider.declarations';
import { GoogleRecaptchaException } from '../exceptions/google-recaptcha.exception';
import { Reflector } from '@nestjs/core';
import { RecaptchaRequestResolver } from '../services/recaptcha-request.resolver';
import { VerifyResponseDecoratorOptions } from '../interfaces/verify-response-decorator-options';
import { RECAPTCHA_LOG_CONTEXT } from '../constants';
import { GoogleRecaptchaModuleOptions } from '../interfaces/google-recaptcha-module-options';

@Injectable()
export class GoogleRecaptchaGuard implements CanActivate {
    constructor(private readonly validator: GoogleRecaptchaValidator,
                private readonly reflector: Reflector,
                private readonly requestResolver: RecaptchaRequestResolver,
                @Inject(RECAPTCHA_LOGGER) private readonly logger: Logger,
                @Inject(RECAPTCHA_OPTIONS) private readonly options: GoogleRecaptchaModuleOptions) {
    }

    async canActivate(context: ExecutionContext): Promise<true | never> {
        const request = this.requestResolver.resolve(context);

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

        if (this.options.debug) {
            this.logger.debug(request.recaptchaValidationResult, `${RECAPTCHA_LOG_CONTEXT}.result`);
        }

        if (request.recaptchaValidationResult.success) {
            return true;
        }

        throw new GoogleRecaptchaException(request.recaptchaValidationResult.errors);
    }
}

import { CanActivate, ExecutionContext, Inject, Injectable, LiteralObject, Logger } from '@nestjs/common';
import { RECAPTCHA_LOGGER, RECAPTCHA_OPTIONS, RECAPTCHA_VALIDATION_OPTIONS } from '../provider.declarations';
import { GoogleRecaptchaException } from '../exceptions/google-recaptcha.exception';
import { Reflector } from '@nestjs/core';
import { RecaptchaRequestResolver } from '../services/recaptcha-request.resolver';
import { VerifyResponseDecoratorOptions } from '../interfaces/verify-response-decorator-options';
import { GoogleRecaptchaModuleOptions } from '../interfaces/google-recaptcha-module-options';
import { RecaptchaValidatorResolver } from '../services/recaptcha-validator.resolver';
import { GoogleRecaptchaContext } from '../enums/google-recaptcha-context';
import { AbstractGoogleRecaptchaValidator } from '../services/validators/abstract-google-recaptcha-validator';
import { GoogleRecaptchaEnterpriseValidator } from '../services/validators/google-recaptcha-enterprise.validator';

@Injectable()
export class GoogleRecaptchaGuard implements CanActivate {
    constructor(private readonly reflector: Reflector,
                private readonly requestResolver: RecaptchaRequestResolver,
                private readonly validatorResolver: RecaptchaValidatorResolver,
                @Inject(RECAPTCHA_LOGGER) private readonly logger: Logger,
                @Inject(RECAPTCHA_OPTIONS) private readonly options: GoogleRecaptchaModuleOptions) {
    }

    async canActivate(context: ExecutionContext): Promise<true | never> {
        const request: LiteralObject = this.requestResolver.resolve(context);

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

        const validator = this.validatorResolver.resolve();

        request.recaptchaValidationResult = await validator.validate({response, score, action});

        if (this.options.debug) {
            const loggerCtx = this.resolveLogContext(validator);
            this.logger.debug(request.recaptchaValidationResult, `${loggerCtx}.result`);
        }

        if (request.recaptchaValidationResult.success) {
            return true;
        }

        throw new GoogleRecaptchaException(request.recaptchaValidationResult.errors);
    }

    private resolveLogContext(validator: AbstractGoogleRecaptchaValidator<unknown>): GoogleRecaptchaContext {
        return validator instanceof GoogleRecaptchaEnterpriseValidator
            ? GoogleRecaptchaContext.GoogleRecaptchaEnterprise
            : GoogleRecaptchaContext.GoogleRecaptcha;
    }
}

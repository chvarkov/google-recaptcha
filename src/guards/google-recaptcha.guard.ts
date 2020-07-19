import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { GoogleRecaptchaValidator } from '../services/google-recaptcha.validator';
import { GoogleRecaptchaGuardOptions } from '../interfaces/google-recaptcha-guard-options';
import { RECAPTCHA_OPTIONS } from '../provider.declarations';

@Injectable()
export class GoogleRecaptchaGuard implements CanActivate {
    constructor(private readonly validator: GoogleRecaptchaValidator,
                @Inject(RECAPTCHA_OPTIONS) private readonly options: GoogleRecaptchaGuardOptions) {
    }

    async canActivate(context: ExecutionContext): Promise<true | never> {
        const request = context.switchToHttp().getRequest();

        const skip = this.options.skipIf ? await this.options.skipIf(request) : false;

        if (skip) {
            return true;
        }

        const response = await this.options.response(request);

        const result = await this.validator.validate(response);

        if (result) {
            return true;
        }

        if (this.options.onError) {
            this.options.onError();
        }

        throw new ForbiddenException('Invalid recaptcha.')
    }
}

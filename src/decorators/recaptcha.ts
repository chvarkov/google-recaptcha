import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { GoogleRecaptchaGuard } from '../guards/google-recaptcha.guard';
import { VerifyResponseDecoratorOptions } from '../interfaces/verify-response-decorator-options';
import { RECAPTCHA_VALIDATION_OPTIONS } from '../provider.declarations';

export function Recaptcha(options?: VerifyResponseDecoratorOptions): MethodDecorator & ClassDecorator {
    return applyDecorators(
        SetMetadata(RECAPTCHA_VALIDATION_OPTIONS, options),
        UseGuards(GoogleRecaptchaGuard),
    );
}

import { SetMetadata } from '@nestjs/common';
import { VerifyResponseDecoratorOptions } from '../interfaces/verify-response-decorator-options';
import { RECAPTCHA_VALIDATION_OPTIONS } from '../provider.declarations';

export function SetRecaptchaOptions(options?: VerifyResponseDecoratorOptions): MethodDecorator & ClassDecorator {
    return SetMetadata(RECAPTCHA_VALIDATION_OPTIONS, options);
}

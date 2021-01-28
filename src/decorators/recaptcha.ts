import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { GoogleRecaptchaGuard } from '../guards/google-recaptcha.guard';
import { RecaptchaResponseProvider } from '../types';
import { RECAPTCHA_RESPONSE_PROVIDER } from '../provider.declarations';

export function Recaptcha(response?: RecaptchaResponseProvider): MethodDecorator & ClassDecorator {
    return applyDecorators(
        SetMetadata(RECAPTCHA_RESPONSE_PROVIDER, response),
        UseGuards(GoogleRecaptchaGuard),
    );
}

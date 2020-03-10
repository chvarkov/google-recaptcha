import { UseGuards } from '@nestjs/common';
import { GoogleRecaptchaGuard } from '../guards/google-recaptcha.guard';

export function Recaptcha(): MethodDecorator {
    return UseGuards(GoogleRecaptchaGuard);
}

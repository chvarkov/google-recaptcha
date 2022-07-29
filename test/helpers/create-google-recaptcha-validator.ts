import { GoogleRecaptchaValidator } from '../../src/services/google-recaptcha.validator';
import { HttpService } from '@nestjs/axios';
import { GoogleRecaptchaValidatorOptions } from '../../src/interfaces/google-recaptcha-validator-options';

export function createGoogleRecaptchaValidator(options: GoogleRecaptchaValidatorOptions): GoogleRecaptchaValidator {
    return new GoogleRecaptchaValidator(new HttpService(), options);
}

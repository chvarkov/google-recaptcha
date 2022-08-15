import { GoogleRecaptchaValidator } from '../../src/services/validators/google-recaptcha.validator';
import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { GoogleRecaptchaModuleOptions } from '../../src';

export function createGoogleRecaptchaValidator(options: GoogleRecaptchaModuleOptions): GoogleRecaptchaValidator {
    return new GoogleRecaptchaValidator(new HttpService(), new Logger(), options);
}

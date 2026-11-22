import { GoogleRecaptchaValidator } from '../../src/services/validators/google-recaptcha.validator.js';
import { Logger } from '@nestjs/common';
import { GoogleRecaptchaModuleOptions } from '../../src/index.js';
import axios from 'axios';
import { RecaptchaConfigRef } from '../../src/models/recaptcha-config-ref.js';

export function createGoogleRecaptchaValidator(options: GoogleRecaptchaModuleOptions): GoogleRecaptchaValidator {
	return new GoogleRecaptchaValidator(axios.create(options.axiosConfig), new Logger(), new RecaptchaConfigRef(options));
}

import { GoogleRecaptchaValidator } from '../../src/services/validators/google-recaptcha.validator';
import { Logger } from '@nestjs/common';
import { GoogleRecaptchaModuleOptions } from '../../src';
import axios from 'axios';
import { RecaptchaConfigRef } from '../../src/models/recaptcha-config-ref';

export function createGoogleRecaptchaValidator(options: GoogleRecaptchaModuleOptions): GoogleRecaptchaValidator {
	return new GoogleRecaptchaValidator(
		axios.create(options.axiosConfig),
		new Logger(),
		new RecaptchaConfigRef(options),
	);
}

import { Injectable } from '@nestjs/common';
import { AbstractGoogleRecaptchaValidator } from './validators/abstract-google-recaptcha-validator.js';
import { GoogleRecaptchaValidator } from './validators/google-recaptcha.validator.js';
import { GoogleRecaptchaEnterpriseValidator } from './validators/google-recaptcha-enterprise.validator.js';
import { RecaptchaConfigRef } from '../models/recaptcha-config-ref.js';

@Injectable()
export class RecaptchaValidatorResolver {
	constructor(
		private readonly configRef: RecaptchaConfigRef,
		protected readonly googleRecaptchaValidator: GoogleRecaptchaValidator,
		protected readonly googleRecaptchaEnterpriseValidator: GoogleRecaptchaEnterpriseValidator
	) {}

	resolve(): AbstractGoogleRecaptchaValidator<unknown> {
		const type: string = this.configRef.valueOf.type;

		switch (type) {
			case 'v2':
			case 'v3':
				return this.googleRecaptchaValidator;

			case 'enterprise':
				return this.googleRecaptchaEnterpriseValidator;

			default:
				throw new Error(`Cannot resolve the Google reCAPTCHA validator for type '${type}'.`);
		}
	}
}

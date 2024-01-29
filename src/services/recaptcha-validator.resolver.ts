import { Injectable } from '@nestjs/common';
import { AbstractGoogleRecaptchaValidator } from './validators/abstract-google-recaptcha-validator';
import { GoogleRecaptchaValidator } from './validators/google-recaptcha.validator';
import { GoogleRecaptchaEnterpriseValidator } from './validators/google-recaptcha-enterprise.validator';
import { RecaptchaConfigRef } from '../models/recaptcha-config-ref';

@Injectable()
export class RecaptchaValidatorResolver {
	constructor(
		private readonly configRef: RecaptchaConfigRef,
		protected readonly googleRecaptchaValidator: GoogleRecaptchaValidator,
		protected readonly googleRecaptchaEnterpriseValidator: GoogleRecaptchaEnterpriseValidator,
	) {}

	resolve(): AbstractGoogleRecaptchaValidator<unknown> {
		const configValue = this.configRef.valueOf;
		if (configValue.secretKey) {
			return this.googleRecaptchaValidator;
		}

		if (Object.keys(configValue.enterprise || {}).length) {
			return this.googleRecaptchaEnterpriseValidator;
		}

		throw new Error('Cannot resolve google recaptcha validator');
	}
}

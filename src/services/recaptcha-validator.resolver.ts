import { Inject, Injectable } from '@nestjs/common';
import { AbstractGoogleRecaptchaValidator } from './validators/abstract-google-recaptcha-validator';
import { RECAPTCHA_OPTIONS } from '../provider.declarations';
import { GoogleRecaptchaModuleOptions } from '../interfaces/google-recaptcha-module-options';
import { GoogleRecaptchaValidator } from './validators/google-recaptcha.validator';
import { GoogleRecaptchaEnterpriseValidator } from './validators/google-recaptcha-enterprise.validator';

@Injectable()
export class RecaptchaValidatorResolver {
	constructor(
		@Inject(RECAPTCHA_OPTIONS) private readonly options: GoogleRecaptchaModuleOptions,
		protected readonly googleRecaptchaValidator: GoogleRecaptchaValidator,
		protected readonly googleRecaptchaEnterpriseValidator: GoogleRecaptchaEnterpriseValidator
	) {}

	resolve(): AbstractGoogleRecaptchaValidator<unknown> {
		if (this.options.secretKey) {
			return this.googleRecaptchaValidator;
		}

		if (Object.keys(this.options.enterprise || {}).length) {
			return this.googleRecaptchaEnterpriseValidator;
		}

		throw new Error('Cannot resolve google recaptcha validator');
	}
}

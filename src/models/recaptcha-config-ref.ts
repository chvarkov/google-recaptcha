import { GoogleRecaptchaModuleOptions } from '../interfaces/google-recaptcha-module-options.js';
import { GoogleRecaptchaEnterpriseOptions } from '../interfaces/google-recaptcha-enterprise-options.js';
import { ScoreValidator, SkipIfValue } from '../types.js';

export class RecaptchaConfigRef {
	get valueOf(): GoogleRecaptchaModuleOptions {
		return this.value;
	}

	private value: GoogleRecaptchaModuleOptions;

	/** Options are copied: setters never mutate the object passed by the user. */
	constructor(value: GoogleRecaptchaModuleOptions) {
		this.value = { ...value };
	}

	/** Keeps `type: 'v2'` / `'v3'`; switching from Enterprise results in reCAPTCHA v3. */
	setSecretKey(secretKey: string): this {
		const value = this.value;

		this.value =
			value.type === 'v2'
				? { ...value, secretKey }
				: { ...value, type: value.type === 'enterprise' ? 'v3' : value.type, secretKey, enterprise: undefined };

		return this;
	}

	/** Switches to reCAPTCHA Enterprise: `secretKey` and `siteVerifyUrl` are reset. */
	setEnterpriseOptions(options: GoogleRecaptchaEnterpriseOptions): this {
		this.value = {
			...this.value,
			type: 'enterprise',
			enterprise: options,
			secretKey: undefined,
			siteVerifyUrl: undefined,
		};

		return this;
	}

	/** @throws Error for reCAPTCHA v2: its response has no score. */
	setScore(score: ScoreValidator): this {
		const value = this.value;

		if (value.type === 'v2') {
			throw new Error('Score is not supported for reCAPTCHA v2.');
		}

		this.value = { ...value, score };

		return this;
	}

	setSkipIf(skipIf: SkipIfValue): this {
		this.value = { ...this.value, skipIf };

		return this;
	}
}

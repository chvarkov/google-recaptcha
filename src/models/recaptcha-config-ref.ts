import { GoogleRecaptchaModuleOptions } from '../interfaces/google-recaptcha-module-options';
import { GoogleRecaptchaEnterpriseOptions } from '../interfaces/google-recaptcha-enterprise-options';
import { ScoreValidator, SkipIfValue } from '../types';

export class RecaptchaConfigRef {
	get valueOf(): GoogleRecaptchaModuleOptions {
		return this.value;
	}

	constructor(private readonly value: GoogleRecaptchaModuleOptions) {
	}

	setSecretKey(secretKey: string): this {
		this.value.secretKey = secretKey;
		this.value.enterprise = undefined;

		return this;
	}

	setEnterpriseOptions(options: GoogleRecaptchaEnterpriseOptions): this {
		this.value.secretKey = undefined;
		this.value.enterprise = options;

		return this;
	}

	setScore(score: ScoreValidator): this {
		this.value.score = score;

		return this;
	}

	setSkipIf(skipIf: SkipIfValue): this {
		this.value.skipIf = skipIf;

		return this;
	}
}

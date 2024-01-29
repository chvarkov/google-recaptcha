import { VerifyResponseOptions } from '../../interfaces/verify-response-decorator-options';
import { ScoreValidator } from '../../types';
import { RecaptchaVerificationResult } from '../../models/recaptcha-verification-result';
import { RecaptchaConfigRef } from '../../models/recaptcha-config-ref';

export abstract class AbstractGoogleRecaptchaValidator<Res> {
	protected constructor(protected readonly options: RecaptchaConfigRef) {}

	abstract validate(options: VerifyResponseOptions): Promise<RecaptchaVerificationResult<Res>>;

	protected isValidAction(action: string, options?: VerifyResponseOptions): boolean {
		if (options.action) {
			return options.action === action;
		}

		return this.options.valueOf.actions ? this.options.valueOf.actions.includes(action) : true;
	}

	protected isValidScore(score: number, validator?: ScoreValidator): boolean {
		const finalValidator = validator || this.options.valueOf.score;

		if (finalValidator) {
			if (typeof finalValidator === 'function') {
				return finalValidator(score);
			}

			return score >= finalValidator;
		}

		return true;
	}
}

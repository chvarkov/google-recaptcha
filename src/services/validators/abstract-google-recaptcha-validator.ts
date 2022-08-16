import { VerifyResponseOptions } from '../../interfaces/verify-response-decorator-options';
import { ScoreValidator } from '../../types';
import { GoogleRecaptchaModuleOptions } from '../../interfaces/google-recaptcha-module-options';
import { RecaptchaVerificationResult } from '../../models/recaptcha-verification-result';

export abstract class AbstractGoogleRecaptchaValidator<Res> {
    protected constructor(protected readonly options: GoogleRecaptchaModuleOptions) {
    }

    abstract validate(options: VerifyResponseOptions): Promise<RecaptchaVerificationResult<Res>>;

    protected isValidAction(action: string, options?: VerifyResponseOptions): boolean {
        if (options.action) {
            return options.action === action;
        }

        return this.options.actions
            ? this.options.actions.includes(action)
            : true;
    }

    protected isValidScore(score: number, validator?: ScoreValidator): boolean {
        const finalValidator = validator || this.options.score;

        if (finalValidator) {
            if (typeof finalValidator === 'function') {
                return finalValidator(score);
            }

            return score >= finalValidator;
        }

        return true;
    }
}

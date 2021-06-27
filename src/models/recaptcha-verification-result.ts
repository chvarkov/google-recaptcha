import { GoogleRecaptchaValidationResult } from '../interfaces/google-recaptcha-validation-result';

export class RecaptchaVerificationResult {
    readonly action: string;
    readonly score: number;
    readonly hostname: string;

    constructor(result: GoogleRecaptchaValidationResult) {
        this.action = result.action;
        this.score = result.score;
        this.hostname = result.hostname;
    }
}

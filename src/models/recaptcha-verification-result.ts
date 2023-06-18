import { ErrorCode } from '../enums/error-code';
import { VerifyResponseEnterpriseRiskAnalysis } from '../interfaces/verify-response-enterprise';
import { LiteralObject } from '../interfaces/literal-object';

export interface RecaptchaVerificationResultOptions<Res> {
	success: boolean;
	nativeResponse: Res;
	hostname: string;
	action?: string;
	score?: number;
	errors: ErrorCode[];
}

export class RecaptchaVerificationResult<Res = LiteralObject> {
	readonly success: boolean;

	readonly hostname: string;

	readonly action: string | undefined;

	readonly score: number | undefined;

	readonly nativeResponse: Res;

	readonly errors: ErrorCode[];

	constructor(private readonly options: RecaptchaVerificationResultOptions<Res>) {
		this.success = options.success;
		this.hostname = options.hostname;
		this.action = options.action;
		this.score = options.score;
		this.errors = options.errors;
		this.nativeResponse = options.nativeResponse;
	}

	toObject(): LiteralObject {
		return {
			success: this.success,
			hostname: this.hostname,
			action: this.action,
			score: this.score,
			errors: this.errors,
			nativeResponse: this.nativeResponse,
		};
	}

	getResponse(): Res {
		return this.nativeResponse;
	}

	getEnterpriseRiskAnalytics(): VerifyResponseEnterpriseRiskAnalysis | null {
		const res = this.getResponse();

		return res['riskAnalysis'] || null;
	}
}

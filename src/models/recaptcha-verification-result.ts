import { ErrorCode } from '../enums/error-code.js';
import { VerifyResponseEnterprise, VerifyResponseEnterpriseRiskAnalysis } from '../interfaces/verify-response-enterprise.js';
import { VerifyResponseV2, VerifyResponseV3 } from '../interfaces/verify-response.js';

/**
 * Raw response of any validator the guard may use.
 * `undefined` when Google did not return a response (Enterprise HTTP error).
 */
export type RecaptchaNativeResponse = VerifyResponseV2 | VerifyResponseV3 | VerifyResponseEnterprise | undefined;

export interface RecaptchaVerificationResultOptions<Res> {
	success: boolean;
	nativeResponse: Res;
	hostname: string;
	action?: string;
	score?: number;
	remoteIp?: string;
	errors: ErrorCode[];
}

export class RecaptchaVerificationResult<Res = RecaptchaNativeResponse> {
	readonly success: boolean;

	readonly hostname: string;

	readonly remoteIp: string | undefined;

	readonly action: string | undefined;

	readonly score: number | undefined;

	readonly nativeResponse: Res;

	readonly errors: ErrorCode[];

	constructor(options: RecaptchaVerificationResultOptions<Res>) {
		this.success = options.success;
		this.hostname = options.hostname;
		this.action = options.action;
		this.remoteIp = options.remoteIp;
		this.score = options.score;
		this.errors = options.errors;
		this.nativeResponse = options.nativeResponse;
	}

	toObject(): RecaptchaVerificationResultOptions<Res> {
		return {
			success: this.success,
			hostname: this.hostname,
			action: this.action,
			score: this.score,
			remoteIp: this.remoteIp,
			errors: this.errors,
			nativeResponse: this.nativeResponse,
		};
	}

	getResponse(): Res {
		return this.nativeResponse;
	}

	getEnterpriseRiskAnalytics(): VerifyResponseEnterpriseRiskAnalysis | null {
		const res = this.getResponse() as { riskAnalysis?: VerifyResponseEnterpriseRiskAnalysis } | null;

		return res?.riskAnalysis || null;
	}
}

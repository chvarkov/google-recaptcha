import { ErrorCode } from '../enums/error-code';

export interface VerifyResponseV2 {
	success: boolean;
	challenge_ts: string;
	hostname: string;
	errors: ErrorCode[];
}

export interface VerifyResponseV3 extends VerifyResponseV2 {
	score: number;
	action: string;
}

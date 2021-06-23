import { ErrorCode } from '../enums/error-code';
import { VerifyResponseV2 } from './verify-response';

export interface GoogleRecaptchaValidationResult extends VerifyResponseV2 {
	success: boolean;
	hostname: string;
	action?: string;
	score?: number;
	errors: ErrorCode[];
}

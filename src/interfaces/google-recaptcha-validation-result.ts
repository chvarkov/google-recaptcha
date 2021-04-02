import { ErrorCode } from '../enums/error-code';

export interface GoogleRecaptchaValidationResult {
	success: boolean;
	score?: number;
	errors: ErrorCode[];
}

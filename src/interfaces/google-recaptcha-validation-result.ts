import { ErrorCode } from '../enums/error-code';

export interface GoogleRecaptchaValidationResult {
	success: boolean;
	errors: ErrorCode[];
}

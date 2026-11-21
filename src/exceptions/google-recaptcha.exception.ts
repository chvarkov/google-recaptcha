import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../enums/error-code';

const DEFAULT_ERROR_MESSAGE = 'Unexpected error. Please submit an issue to @nestlab/google-recaptcha.';

const ERROR_MESSAGES: Partial<Record<ErrorCode, string>> = {
	[ErrorCode.InvalidInputResponse]: 'The response parameter is invalid or malformed.',
	[ErrorCode.MissingInputResponse]: 'The response parameter is missing.',
	[ErrorCode.TimeoutOrDuplicate]: 'The response is no longer valid: it is either too old or has already been used.',
	[ErrorCode.InvalidInputSecret]: 'Invalid module configuration. Please check the secret key.',
	[ErrorCode.MissingInputSecret]: 'Invalid module configuration. Please check the secret key.',
	[ErrorCode.InvalidKeys]: 'The reCAPTCHA token was signed by an invalid API key.',
	[ErrorCode.LowScore]: 'Low reCAPTCHA score.',
	[ErrorCode.ForbiddenAction]: 'Forbidden reCAPTCHA action.',
	[ErrorCode.SiteMismatch]: 'The user verification token did not match the provided site key.',
	[ErrorCode.BrowserError]: 'A retriable error (such as a network failure) occurred in the browser.',
	[ErrorCode.IncorrectCaptchaSol]: 'Incorrect captcha solution.',
};

/** Error codes caused by the client (invalid/expired token, low score, etc.). Everything else is a server-side error. */
const CLIENT_ERROR_CODES: ReadonlySet<ErrorCode> = new Set([
	ErrorCode.InvalidInputResponse,
	ErrorCode.MissingInputResponse,
	ErrorCode.TimeoutOrDuplicate,
	ErrorCode.ForbiddenAction,
	ErrorCode.SiteMismatch,
	ErrorCode.BrowserError,
	ErrorCode.IncorrectCaptchaSol,
	ErrorCode.LowScore,
	ErrorCode.InvalidKeys,
]);

export class GoogleRecaptchaException extends HttpException {
	constructor(
		public readonly errorCodes: ErrorCode[],
		errorMessage?: string
	) {
		super(
			errorMessage || GoogleRecaptchaException.getErrorMessage(errorCodes[0]),
			GoogleRecaptchaException.getErrorStatus(errorCodes[0])
		);
	}

	private static getErrorMessage(errorCode: ErrorCode): string {
		return ERROR_MESSAGES[errorCode] ?? DEFAULT_ERROR_MESSAGE;
	}

	private static getErrorStatus(errorCode: ErrorCode): number {
		return CLIENT_ERROR_CODES.has(errorCode) ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR;
	}
}

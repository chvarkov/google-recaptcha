import {HttpException, HttpStatus} from '@nestjs/common';
import {ErrorCode} from '../enums/error-code';

export class GoogleRecaptchaException extends HttpException {
	constructor(public readonly errorCodes: ErrorCode[],
                errorMessage?: string) {
        super(
            errorMessage || GoogleRecaptchaException.getErrorMessage(errorCodes[0]),
            GoogleRecaptchaException.getErrorStatus(errorCodes[0]),
        );
	}

	private static getErrorMessage(errorCode: ErrorCode): string {
		switch (errorCode) {
			case ErrorCode.InvalidInputResponse:
				return 'The response parameter is invalid or malformed.';

			case ErrorCode.MissingInputResponse:
				return 'The response parameter is missing.';
			case ErrorCode.TimeoutOrDuplicate:
				return 'The response is no longer valid: either is too old or has been used previously.';

			case ErrorCode.InvalidInputSecret:
			case ErrorCode.MissingInputSecret:
				return 'Invalid module configuration. Please check public-secret keys.';

			case ErrorCode.InvalidKeys:
				return 'Recaptcha token was signed by invalid api key.';

			case ErrorCode.LowScore:
				return 'Low recaptcha score.';

			case ErrorCode.ForbiddenAction:
				return 'Forbidden recaptcha action.';

			case ErrorCode.SiteMismatch:
				return 'The user verification token did not match the provided site key.';

			case ErrorCode.BrowserError:
				return 'Retriable error (such as network failure) occurred on the browser.';

			case ErrorCode.UnknownError:
			case ErrorCode.BadRequest:
			default:
				return 'Unexpected error. Please submit issue to @nestlab/google-recaptcha.';
		}
	}

	private static getErrorStatus(errorCode: ErrorCode): number {
		return errorCode === ErrorCode.InvalidInputResponse ||
			errorCode === ErrorCode.MissingInputResponse ||
			errorCode === ErrorCode.TimeoutOrDuplicate ||
			errorCode === ErrorCode.ForbiddenAction ||
			errorCode === ErrorCode.SiteMismatch ||
			errorCode === ErrorCode.BrowserError ||
			errorCode === ErrorCode.LowScore ||
			errorCode === ErrorCode.InvalidKeys
		? HttpStatus.BAD_REQUEST
		: HttpStatus.INTERNAL_SERVER_ERROR;
	}
}

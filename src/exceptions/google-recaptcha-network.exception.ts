import { GoogleRecaptchaException } from './google-recaptcha.exception.js';
import { ErrorCode } from '../enums/error-code.js';

export class GoogleRecaptchaNetworkException extends GoogleRecaptchaException {
	constructor(public readonly networkErrorCode?: string) {
		super([ErrorCode.NetworkError], networkErrorCode ? `Network error '${networkErrorCode}'.` : 'Unknown network error.');
	}
}

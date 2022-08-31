import { GoogleRecaptchaException } from './google-recaptcha.exception';
import { ErrorCode } from '../enums/error-code';

export class GoogleRecaptchaNetworkException extends GoogleRecaptchaException {
	constructor(public readonly networkErrorCode?: string) {
		super([ErrorCode.NetworkError], networkErrorCode ? `Network error '${networkErrorCode}'.` : 'Unknown network error.');
	}
}

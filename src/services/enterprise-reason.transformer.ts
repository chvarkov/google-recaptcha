import { Injectable } from '@nestjs/common';
import { GoogleRecaptchaEnterpriseReason } from '../enums/google-recaptcha-enterprise-reason';
import { ErrorCode } from '../enums/error-code';

@Injectable()
export class EnterpriseReasonTransformer {
	transform(errCode: GoogleRecaptchaEnterpriseReason): ErrorCode {
		switch (errCode) {
			case GoogleRecaptchaEnterpriseReason.BrowserError:
				return ErrorCode.BrowserError;

			case GoogleRecaptchaEnterpriseReason.UnknownInvalidReason:
				return ErrorCode.UnknownError;

			case GoogleRecaptchaEnterpriseReason.SiteMismatch:
				return ErrorCode.SiteMismatch;

			case GoogleRecaptchaEnterpriseReason.Expired:
			case GoogleRecaptchaEnterpriseReason.Dupe:
				return ErrorCode.TimeoutOrDuplicate;

			case GoogleRecaptchaEnterpriseReason.Malformed:
				return ErrorCode.InvalidInputResponse;

			case GoogleRecaptchaEnterpriseReason.Missing:
				return ErrorCode.MissingInputResponse;

			case GoogleRecaptchaEnterpriseReason.InvalidReasonUnspecified:
				return ErrorCode.UnknownError;

			default:
				return ErrorCode.UnknownError;
		}
	}
}

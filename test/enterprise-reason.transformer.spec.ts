import { EnterpriseReasonTransformer } from '../src/services/enterprise-reason.transformer';
import { GoogleRecaptchaEnterpriseReason } from '../src/enums/google-recaptcha-enterprise-reason';
import { ErrorCode } from '../src';

describe('EnterpriseReasonTransformer', () => {
	const transformer = new EnterpriseReasonTransformer();

	const expectedMap: Map<GoogleRecaptchaEnterpriseReason, ErrorCode> = new Map<GoogleRecaptchaEnterpriseReason, ErrorCode>([
		[GoogleRecaptchaEnterpriseReason.InvalidReasonUnspecified, ErrorCode.UnknownError],
		[GoogleRecaptchaEnterpriseReason.UnknownInvalidReason, ErrorCode.UnknownError],
		[GoogleRecaptchaEnterpriseReason.Malformed, ErrorCode.InvalidInputResponse],
		[GoogleRecaptchaEnterpriseReason.Expired, ErrorCode.TimeoutOrDuplicate],
		[GoogleRecaptchaEnterpriseReason.Dupe, ErrorCode.TimeoutOrDuplicate],
		[GoogleRecaptchaEnterpriseReason.SiteMismatch, ErrorCode.SiteMismatch],
		[GoogleRecaptchaEnterpriseReason.Missing, ErrorCode.MissingInputResponse],
		[GoogleRecaptchaEnterpriseReason.BrowserError, ErrorCode.BrowserError],
		['UNKNOWN_ERROR_CODE_TEST' as GoogleRecaptchaEnterpriseReason, ErrorCode.UnknownError],
	]);

	test('transform', () => {
		Array.from(expectedMap.keys()).forEach((enterpriseReason) => {
			const errorCode = transformer.transform(enterpriseReason);
			expect(errorCode).toBe(expectedMap.get(enterpriseReason));
		});
	});
});

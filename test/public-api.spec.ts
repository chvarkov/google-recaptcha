// Compile-time check (test:types): public types must be importable from the package root.
import {
	ErrorCode,
	GoogleRecaptchaEnterpriseReason,
	GoogleRecaptchaEnterpriseOptions,
	GoogleRecaptchaGuardOptions,
	GoogleRecaptchaModuleAsyncOptions,
	GoogleRecaptchaModuleOptions,
	GoogleRecaptchaOptionsFactory,
	GoogleRecaptchaValidatorOptions,
	RecaptchaRemoteIpProvider,
	RecaptchaResponseProvider,
	ScoreValidator,
	SkipIfValue,
	VerifyResponseDecoratorOptions,
	VerifyResponseEnterprise,
	VerifyResponseEnterpriseRiskAnalysis,
	VerifyResponseEnterpriseTokenProperties,
	VerifyResponseOptions,
	VerifyResponseV2,
	VerifyResponseV3,
	VerifyTokenEnterpriseEvent,
	VerifyTokenEnterpriseResponseEvent,
} from '../src';

describe('Public API', () => {
	test('exports public types and enums from the package root', () => {
		const response: RecaptchaResponseProvider = (req) => req.body.recaptcha;
		const remoteIp: RecaptchaRemoteIpProvider = (req) => req.ip;
		const score: ScoreValidator = 0.5;
		const skipIf: SkipIfValue = false;

		const enterprise: GoogleRecaptchaEnterpriseOptions = { projectId: 'p', siteKey: 's', apiKey: 'k' };
		const validatorOptions: GoogleRecaptchaValidatorOptions = { enterprise };
		const guardOptions: GoogleRecaptchaGuardOptions = { response, remoteIp, score, skipIf };
		const moduleOptions: GoogleRecaptchaModuleOptions = { ...validatorOptions, ...guardOptions };

		const factory: GoogleRecaptchaOptionsFactory = { createGoogleRecaptchaOptions: () => moduleOptions };
		const asyncOptions: GoogleRecaptchaModuleAsyncOptions = { useFactory: () => factory.createGoogleRecaptchaOptions() };

		const decoratorOptions: VerifyResponseDecoratorOptions = { action: 'login', score };
		const verifyOptions: VerifyResponseOptions = { response: 'token', action: 'login' };

		const v2: VerifyResponseV2 = { success: true, hostname: 'localhost', challenge_ts: '', errors: [] };
		const v3: VerifyResponseV3 = { ...v2, score: 0.9, action: 'login' };

		const event: VerifyTokenEnterpriseEvent = { token: 't', siteKey: 's' };
		const responseEvent: VerifyTokenEnterpriseResponseEvent = {
			...event,
			userAgent: '',
			userIpAddress: '',
			hashedAccountId: '',
		};
		const tokenProperties: VerifyResponseEnterpriseTokenProperties = {
			valid: false,
			invalidReason: GoogleRecaptchaEnterpriseReason.Expired,
			hostname: '',
			action: '',
			createTime: '',
		};
		const riskAnalysis: VerifyResponseEnterpriseRiskAnalysis = { score: 0.1, reasons: [] };
		const enterpriseResponse: VerifyResponseEnterprise = { tokenProperties, riskAnalysis, event: responseEvent, name: '' };

		expect([asyncOptions, decoratorOptions, verifyOptions, v3, enterpriseResponse]).toHaveLength(5);
		expect(GoogleRecaptchaEnterpriseReason.Expired).toBeDefined();
		expect(ErrorCode.InvalidInputResponse).toBeDefined();
	});
});

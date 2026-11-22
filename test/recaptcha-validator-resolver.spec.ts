import { GoogleRecaptchaEnterpriseValidator, GoogleRecaptchaModuleOptions, GoogleRecaptchaValidator } from '../src/index.js';
import { RecaptchaValidatorResolver } from '../src/services/recaptcha-validator.resolver.js';
import { RecaptchaConfigRef } from '../src/models/recaptcha-config-ref.js';

describe('RecaptchaValidatorResolver', () => {
	// Dependencies are not used: the resolver only picks an instance.
	const validator = new GoogleRecaptchaValidator(null!, null!, null!);
	const enterpriseValidator = new GoogleRecaptchaEnterpriseValidator(null!, null!, null!, null!);

	const createResolver = (options: GoogleRecaptchaModuleOptions) =>
		new RecaptchaValidatorResolver(new RecaptchaConfigRef(options), validator, enterpriseValidator);

	test('resolve', () => {
		const moduleOptions: GoogleRecaptchaModuleOptions = {
			response: (): string => 'token',
			type: 'v3',
			secretKey: 'Secret',
		};

		const resolver = createResolver(moduleOptions);

		const resolvedValidator = resolver.resolve();

		expect(resolvedValidator).toBeInstanceOf(GoogleRecaptchaValidator);
	});

	test('resolve enterprise', () => {
		const moduleOptions: GoogleRecaptchaModuleOptions = {
			response: (): string => 'token',
			type: 'enterprise',
			enterprise: {
				apiKey: 'enterprise_apiKey',
				siteKey: 'enterprise_siteKey',
				projectId: 'enterprise_projectId',
			},
		};

		const resolver = createResolver(moduleOptions);
		const resolvedValidator = resolver.resolve();

		expect(resolvedValidator).toBeInstanceOf(GoogleRecaptchaEnterpriseValidator);
	});

	test('resolve error', () => {
		// @ts-expect-error neither `secretKey` nor `enterprise`: rejected by types, checked at runtime for JS users
		const moduleOptions: GoogleRecaptchaModuleOptions = {
			response: (): string => 'token',
		};

		const resolver = createResolver(moduleOptions);
		expect(() => resolver.resolve()).toThrow('Cannot resolve');
	});
});

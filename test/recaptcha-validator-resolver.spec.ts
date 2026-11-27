import {
	ErrorCode,
	GoogleRecaptchaEnterpriseValidator,
	GoogleRecaptchaException,
	GoogleRecaptchaModuleOptions,
	GoogleRecaptchaValidator,
} from '../src/index.js';
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
		// @ts-expect-error no `type`: rejected by types; treated as not configured
		const moduleOptions: GoogleRecaptchaModuleOptions = {
			response: (): string => 'token',
		};

		const resolver = createResolver(moduleOptions);
		expect(() => resolver.resolve()).toThrow(new GoogleRecaptchaException([ErrorCode.NotConfigured]));
	});

	test('resolve error: unknown type', () => {
		const resolver = createResolver({
			response: (): string => 'token',
			type: 'v4',
			secretKey: 'S',
		} as unknown as GoogleRecaptchaModuleOptions);

		expect(() => resolver.resolve()).toThrow("Cannot resolve the Google reCAPTCHA validator for type 'v4'.");
	});

	test('resolves by the current config after setOptions()', () => {
		const configRef = new RecaptchaConfigRef({ response: (): string => 'token', type: 'v3', secretKey: 'Secret' });
		const resolver = new RecaptchaValidatorResolver(configRef, validator, enterpriseValidator);

		configRef.setOptions({ type: 'enterprise', enterprise: { apiKey: 'k', siteKey: 's', projectId: 'p' } });
		expect(resolver.resolve()).toBe(enterpriseValidator);

		configRef.setOptions({ type: 'v2', secretKey: 'V2' });
		expect(resolver.resolve()).toBe(validator);
	});
});

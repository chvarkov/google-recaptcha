import { Injectable } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
	ErrorCode,
	GoogleRecaptchaDeferredModuleOptions,
	GoogleRecaptchaEnterpriseValidator,
	GoogleRecaptchaException,
	GoogleRecaptchaModule,
	GoogleRecaptchaOptionsFactory,
	GoogleRecaptchaValidator,
	RecaptchaConfigRef,
} from '../src/index.js';

const response = (): string => 'token';

const compile = (options: GoogleRecaptchaDeferredModuleOptions) =>
	Test.createTestingModule({ imports: [GoogleRecaptchaModule.forRootDeferred(options)] }).compile();

@Injectable()
class DeferredOptionsFactory implements GoogleRecaptchaOptionsFactory<GoogleRecaptchaDeferredModuleOptions> {
	createGoogleRecaptchaOptions(): GoogleRecaptchaDeferredModuleOptions {
		return { response, whenNotConfigured: 'skip' };
	}
}

describe('GoogleRecaptchaModule.forRootDeferred()', () => {
	test('starts without keys', async () => {
		const module = await compile({ response, debug: true });
		const configRef = module.get(RecaptchaConfigRef);

		expect(configRef.isConfigured).toBe(false);
		expect(configRef.whenNotConfigured).toBe('reject');
		expect(configRef.valueOf.type).toBeUndefined();
		expect(configRef.valueOf.debug).toBe(true);
		expect(configRef.valueOf).not.toHaveProperty('whenNotConfigured');
	});

	test('validators throw not-configured until configured', async () => {
		const module = await compile({ response });

		const expected = new GoogleRecaptchaException([ErrorCode.NotConfigured]);

		expect(expected.message).toBe('Google reCAPTCHA is not configured.');
		expect(expected.getStatus()).toBe(500);

		await expect(module.get(GoogleRecaptchaValidator).validate({ response: 'token' })).rejects.toThrow(expected);
		await expect(module.get(GoogleRecaptchaEnterpriseValidator).validate({ response: 'token' })).rejects.toThrow(expected);
	});

	test.each([
		[{ type: 'v3' }, 'type'],
		[{ secretKey: 'S' }, 'secretKey'],
		[{ siteVerifyUrl: 'https://proxy.local' }, 'siteVerifyUrl'],
		[{ enterprise: { projectId: 'p', siteKey: 's', apiKey: 'k' } }, 'enterprise'],
		[{ score: 0.5 }, 'score'],
		[{ actions: ['login'] }, 'actions'],
	])('rejects keys at startup: %j', async (keys, key) => {
		await expect(compile({ response, ...keys } as unknown as GoogleRecaptchaDeferredModuleOptions)).rejects.toThrow(
			`GoogleRecaptchaModule.forRootDeferred() does not accept "${key}": set it via RecaptchaConfigRef.setOptions() or use forRoot().`
		);
	});

	test('rejects unknown whenNotConfigured', async () => {
		await expect(compile({ response, whenNotConfigured: 'allow' } as unknown as GoogleRecaptchaDeferredModuleOptions)).rejects.toThrow(
			'Unknown "whenNotConfigured" value \'allow\'. Expected one of: reject, skip.'
		);
	});

	test('forRootDeferredAsync: useFactory', async () => {
		const module = await Test.createTestingModule({
			imports: [GoogleRecaptchaModule.forRootDeferredAsync({ useFactory: async () => ({ response, whenNotConfigured: 'skip' }) })],
		}).compile();

		const configRef = module.get(RecaptchaConfigRef);

		expect(configRef.isConfigured).toBe(false);
		expect(configRef.whenNotConfigured).toBe('skip');
	});

	test('forRootDeferredAsync: useClass', async () => {
		const module = await Test.createTestingModule({
			imports: [GoogleRecaptchaModule.forRootDeferredAsync({ useClass: DeferredOptionsFactory })],
		}).compile();

		expect(module.get(RecaptchaConfigRef).whenNotConfigured).toBe('skip');
	});

	test('forRootDeferredAsync: keys returned by the factory are rejected', async () => {
		await expect(
			Test.createTestingModule({
				imports: [
					GoogleRecaptchaModule.forRootDeferredAsync({
						useFactory: () => ({ response, type: 'v3', secretKey: 'S' }) as unknown as GoogleRecaptchaDeferredModuleOptions,
					}),
				],
			}).compile()
		).rejects.toThrow('does not accept "type"');
	});

	test('types', () => {
		// @ts-expect-error keys are set via RecaptchaConfigRef.setOptions()
		const withKey: GoogleRecaptchaDeferredModuleOptions = { response, type: 'v3', secretKey: 'S' };

		// @ts-expect-error unknown whenNotConfigured
		const unknownMode: GoogleRecaptchaDeferredModuleOptions = { response, whenNotConfigured: 'allow' };

		// @ts-expect-error response is required
		const noResponse: GoogleRecaptchaDeferredModuleOptions = {};

		// @ts-expect-error forRoot() still requires keys
		const forRoot = () => GoogleRecaptchaModule.forRoot({ response });

		expect([withKey, unknownMode, noResponse, forRoot]).toHaveLength(4);
	});

	test.each([
		['forRoot', () => GoogleRecaptchaModule.forRoot({ type: 'v2', secretKey: 'S', response, unsupportedChecks: 'skip' as 'ignore' })],
		['forRootDeferred', () => GoogleRecaptchaModule.forRootDeferred({ response, unsupportedChecks: 'skip' as 'ignore' })],
	])('%s rejects unknown unsupportedChecks', async (_, createModule) => {
		await expect(Test.createTestingModule({ imports: [createModule()] }).compile()).rejects.toThrow(
			'Unknown "unsupportedChecks" value \'skip\'. Expected one of: reject, ignore.'
		);
	});

	test('types: unsupportedChecks', () => {
		const ignore: GoogleRecaptchaDeferredModuleOptions = { response, unsupportedChecks: 'ignore' };

		// @ts-expect-error unknown value
		const unknown: GoogleRecaptchaDeferredModuleOptions = { response, unsupportedChecks: 'skip' };

		expect([ignore, unknown]).toHaveLength(2);
	});

	test('forRootDeferredAsync: options provider is required', () => {
		expect(() => GoogleRecaptchaModule.forRootDeferredAsync({})).toThrow(
			"GoogleRecaptchaModule.forRootDeferredAsync() requires one of 'useFactory', 'useClass' or 'useExisting'."
		);
	});
});

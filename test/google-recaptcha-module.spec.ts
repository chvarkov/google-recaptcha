import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { GoogleRecaptchaValidator } from '../src/services/validators/google-recaptcha.validator';
import { GoogleRecaptchaGuard, GoogleRecaptchaModuleOptions, GoogleRecaptchaModule } from '../src';
import { RECAPTCHA_OPTIONS } from '../src/provider.declarations';

describe('Google recaptcha module', () => {
	const customSiteVerifyUrl = 'CUSTOM_URL';

	const createApp = async (options: GoogleRecaptchaModuleOptions): Promise<INestApplication> => {
		const testingModule = await Test.createTestingModule({
			imports: [GoogleRecaptchaModule.forRoot(options)],
		}).compile();

		return testingModule.createNestApplication();
	};

	let app: INestApplication;

	beforeAll(async () => {
		app = await createApp({
			secretKey: 'secret key',
			response: (req) => req.headers.authorization,
			skipIf: () => process.env.NODE_ENV !== 'production',
			siteVerifyUrl: customSiteVerifyUrl,
			global: false,
		});
	});

	test('Test validator provider', () => {
		const guard = app.get(GoogleRecaptchaValidator);

		expect(guard).toBeInstanceOf(GoogleRecaptchaValidator);
	});

	test('Test guard provider', () => {
		const guard = app.get(GoogleRecaptchaGuard);

		expect(guard).toBeInstanceOf(GoogleRecaptchaGuard);
	});

	test('Test use recaptcha net options', async () => {
		const options: GoogleRecaptchaModuleOptions = app.get(RECAPTCHA_OPTIONS);

		expect(options).toBeDefined();
		expect(options.siteVerifyUrl).toBe(customSiteVerifyUrl);
	});

	test('Test invalid config', async () => {
		// @ts-expect-error neither `secretKey` nor `enterprise`: rejected by types, checked at runtime for JS users
		await expect(createApp({ response: () => '' })).rejects.toThrow(
			'Google reCAPTCHA options must contain either "secretKey" or "enterprise", but not both.'
		);
	});
});

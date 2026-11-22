import { Test } from '@nestjs/testing';
import { Controller, INestApplication, Module, Post } from '@nestjs/common';
import { GoogleRecaptchaValidator } from '../src/services/validators/google-recaptcha.validator.js';
import { GoogleRecaptchaGuard, GoogleRecaptchaModuleOptions, GoogleRecaptchaModule, Recaptcha } from '../src/index.js';
import { RECAPTCHA_OPTIONS } from '../src/provider.declarations.js';

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
			type: 'v3',
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

describe('Google recaptcha module: global scope', () => {
	const options = { type: 'v3' as const, secretKey: 'secret', response: (): string => 'token' };

	test('Not global by default', () => {
		expect(GoogleRecaptchaModule.forRoot(options).global).toBe(false);
		expect(GoogleRecaptchaModule.forRootAsync({ useFactory: () => options }).global).toBe(false);
	});

	@Controller('feature')
	class FeatureController {
		@Recaptcha()
		@Post()
		submit(): void {}
	}

	const compileWithFeatureModule = (featureImports: unknown[], rootImports: unknown[]) => {
		@Module({ imports: featureImports as [], controllers: [FeatureController] })
		class FeatureModule {}

		return Test.createTestingModule({ imports: [...(rootImports as []), FeatureModule] }).compile();
	};

	test('@Recaptcha() in a module without access to GoogleRecaptchaModule fails to resolve the guard', async () => {
		await expect(compileWithFeatureModule([], [GoogleRecaptchaModule.forRoot(options)])).rejects.toThrow(
			"Nest can't resolve dependencies of the GoogleRecaptchaGuard"
		);
	});

	test('@Recaptcha() in another module works with `global: true`', async () => {
		await expect(compileWithFeatureModule([], [GoogleRecaptchaModule.forRoot({ ...options, global: true })])).resolves.toBeDefined();
	});

	test('@Recaptcha() in another module works when the configured module is re-exported', async () => {
		@Module({ imports: [GoogleRecaptchaModule.forRoot(options)], exports: [GoogleRecaptchaModule] })
		class RecaptchaSharedModule {}

		await expect(compileWithFeatureModule([RecaptchaSharedModule], [])).resolves.toBeDefined();
	});

	test('Global when `global: true`', () => {
		expect(GoogleRecaptchaModule.forRoot({ ...options, global: true }).global).toBe(true);
		expect(GoogleRecaptchaModule.forRootAsync({ useFactory: () => options, global: true }).global).toBe(true);
	});
});

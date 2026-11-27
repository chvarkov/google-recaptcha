import { GoogleRecaptchaException, GoogleRecaptchaGuard, GoogleRecaptchaModuleOptions, RecaptchaVerificationResult } from '../src/index.js';
import { Reflector } from '@nestjs/core';
import { GoogleRecaptchaGuardOptions } from '../src/interfaces/google-recaptcha-guard-options.js';
import { createGoogleRecaptchaValidator } from './helpers/create-google-recaptcha-validator.js';
import { GoogleRecaptchaValidatorOptions } from '../src/interfaces/google-recaptcha-validator-options.js';
import { createExecutionContext } from './helpers/create-execution-context.js';
import { TestController } from './assets/test-controller.js';
import { TestRecaptchaNetwork } from './network/test-recaptcha-network.js';
import { RecaptchaRequestResolver } from '../src/services/recaptcha-request.resolver.js';
import { Logger } from '@nestjs/common';
import { createGoogleRecaptchaEnterpriseValidator } from './helpers/create-google-recaptcha-enterprise-validator.js';
import { RecaptchaValidatorResolver } from '../src/services/recaptcha-validator.resolver.js';
import { RecaptchaConfigRef } from '../src/models/recaptcha-config-ref.js';

describe('Google recaptcha guard', () => {
	let network: TestRecaptchaNetwork;
	const networkPort = 6048;
	const validatorOptions: GoogleRecaptchaValidatorOptions = {
		type: 'v3',
		secretKey: 'Secret',
	};
	const guardOptions: GoogleRecaptchaGuardOptions = {
		response: (req) => req.body.recaptcha,
	};

	const controller = new TestController();

	beforeAll(async () => {
		network = await TestRecaptchaNetwork.create(networkPort);
	});

	afterAll(async () => {
		await network.close();
	});

	test('SkipIf = true + default response provider', async () => {
		const options = { ...validatorOptions, ...guardOptions };
		const validator = createGoogleRecaptchaValidator(options);
		const enterpriseValidator = createGoogleRecaptchaEnterpriseValidator(options);
		const configRef = new RecaptchaConfigRef(options);
		const validatorResolver = new RecaptchaValidatorResolver(configRef, validator, enterpriseValidator);

		const guard = new GoogleRecaptchaGuard(
			new Reflector(),
			new RecaptchaRequestResolver(),
			validatorResolver,
			new Logger(),
			new RecaptchaConfigRef({ ...options, skipIf: true })
		);

		const context = createExecutionContext(controller.submit, { body: { recaptcha: 'RECAPTCHA_TOKEN' } });

		const canActivate = await guard.canActivate(context);

		expect(canActivate).toBeTruthy();
	});

	test('SkipIf = (req) => true + overridden response provider', async () => {
		const options = { ...validatorOptions, ...guardOptions };
		const validator = createGoogleRecaptchaValidator(options);
		const enterpriseValidator = createGoogleRecaptchaEnterpriseValidator(options);
		const validatorResolver = new RecaptchaValidatorResolver(new RecaptchaConfigRef(options), validator, enterpriseValidator);

		const guard = new GoogleRecaptchaGuard(
			new Reflector(),
			new RecaptchaRequestResolver(),
			validatorResolver,
			new Logger(),
			new RecaptchaConfigRef({ ...options, skipIf: (): boolean => true })
		);

		const context = createExecutionContext(controller.submitOverridden.prototype, { body: { recaptcha: 'RECAPTCHA_TOKEN' } });

		const canActivate = await guard.canActivate(context);

		expect(canActivate).toBeTruthy();
	});

	test('SkipIf = typed (req) => boolean receives the request', async () => {
		const options = { ...validatorOptions, ...guardOptions };
		const validator = createGoogleRecaptchaValidator(options);
		const enterpriseValidator = createGoogleRecaptchaEnterpriseValidator(options);
		const validatorResolver = new RecaptchaValidatorResolver(new RecaptchaConfigRef(options), validator, enterpriseValidator);

		// Typed parameter must be accepted by SkipIfValue (compile-time check via test:types).
		const skipIf = vi.fn(async (req: { headers: Record<string, string> }): Promise<boolean> => req.headers['x-skip'] === '1');

		const guard = new GoogleRecaptchaGuard(
			new Reflector(),
			new RecaptchaRequestResolver(),
			validatorResolver,
			new Logger(),
			new RecaptchaConfigRef({ ...options, skipIf })
		);

		const request = { headers: { 'x-skip': '1' }, body: {} };
		const context = createExecutionContext(controller.submit.prototype, request);

		await expect(guard.canActivate(context)).resolves.toBe(true);
		expect(skipIf).toHaveBeenCalledWith(request);
	});

	test('Invalid secret', async () => {
		const options = { ...validatorOptions, ...guardOptions };
		const validator = createGoogleRecaptchaValidator(options);
		const enterpriseValidator = createGoogleRecaptchaEnterpriseValidator(options);
		const validatorResolver = new RecaptchaValidatorResolver(new RecaptchaConfigRef(options), validator, enterpriseValidator);

		const guard = new GoogleRecaptchaGuard(
			new Reflector(),
			new RecaptchaRequestResolver(),
			validatorResolver,
			new Logger(),
			new RecaptchaConfigRef(options)
		);

		const context = createExecutionContext(controller.submit, { body: { recaptcha: 'RECAPTCHA_TOKEN' } });

		await guard
			.canActivate(context)
			.then(() => expect(true).toBeFalsy())
			.catch((e) => expect(e).toBeInstanceOf(GoogleRecaptchaException));
	});

	test('Invalid siteVerifyUrl', async () => {
		const options = {
			...validatorOptions,
			...guardOptions,
			siteVerifyUrl: 'https://localhost/some-invalid-path',
		};

		const validator = createGoogleRecaptchaValidator(options);
		const enterpriseValidator = createGoogleRecaptchaEnterpriseValidator(options);
		const validatorResolver = new RecaptchaValidatorResolver(new RecaptchaConfigRef(options), validator, enterpriseValidator);

		const guard = new GoogleRecaptchaGuard(
			new Reflector(),
			new RecaptchaRequestResolver(),
			validatorResolver,
			new Logger(),
			new RecaptchaConfigRef({ ...guardOptions, ...validatorOptions })
		);

		const context = createExecutionContext(controller.submit, { body: { recaptcha: 'RECAPTCHA_TOKEN' } });

		await guard
			.canActivate(context)
			.then(() => expect(true).toBeFalsy())
			.catch((e) => expect(e).toBeInstanceOf(GoogleRecaptchaException));
	});

	test('Valid', async () => {
		network.setResult({
			success: true,
		});
		const options = {
			...validatorOptions,
			...guardOptions,
			siteVerifyUrl: network.url,
		};

		const validator = createGoogleRecaptchaValidator(options);
		const enterpriseValidator = createGoogleRecaptchaEnterpriseValidator(options);
		const validatorResolver = new RecaptchaValidatorResolver(new RecaptchaConfigRef(options), validator, enterpriseValidator);

		const guard = new GoogleRecaptchaGuard(
			new Reflector(),
			new RecaptchaRequestResolver(),
			validatorResolver,
			new Logger(),
			new RecaptchaConfigRef(options)
		);

		const context = createExecutionContext(controller.submit, { body: { recaptcha: 'RECAPTCHA_TOKEN' } });

		const canActivate = await guard.canActivate(context);

		expect(canActivate).toBeTruthy();
	});

	test('Unsupported request type', async () => {
		const options = {} as GoogleRecaptchaModuleOptions;

		const validator = createGoogleRecaptchaValidator(options);
		const enterpriseValidator = createGoogleRecaptchaEnterpriseValidator(options);
		const validatorResolver = new RecaptchaValidatorResolver(new RecaptchaConfigRef(options), validator, enterpriseValidator);

		const guard = new GoogleRecaptchaGuard(
			new Reflector(),
			new RecaptchaRequestResolver(),
			validatorResolver,
			new Logger(),
			new RecaptchaConfigRef(options)
		);

		const context = createExecutionContext(controller.submit, { body: { recaptcha: 'RECAPTCHA_TOKEN' } });

		Object.assign(context, { getType: () => 'unknown' });

		await expect(guard.canActivate(context)).rejects.toThrow('Unsupported request type');
	});

	test('logger errors do not affect the guard result', async () => {
		const options = { ...validatorOptions, ...guardOptions, debug: true };
		const configRef = new RecaptchaConfigRef(options);
		const result = new RecaptchaVerificationResult({ success: true, errors: [], hostname: 'localhost', nativeResponse: undefined });
		const validatorResolver = {
			resolve: () => ({ logContext: 'GoogleRecaptcha', validate: () => Promise.resolve(result) }),
		} as unknown as RecaptchaValidatorResolver;
		const logger = new Logger();
		const debug = vi.spyOn(logger, 'debug').mockImplementation(() => {
			throw new Error('logger is broken');
		});

		const guard = new GoogleRecaptchaGuard(new Reflector(), new RecaptchaRequestResolver(), validatorResolver, logger, configRef);
		const context = createExecutionContext(controller.submit, { body: { recaptcha: 'RECAPTCHA_TOKEN' } });

		await expect(guard.canActivate(context)).resolves.toBe(true);
		expect(debug).toHaveBeenCalledWith(result.toObject(), 'GoogleRecaptcha.result');
	});
});

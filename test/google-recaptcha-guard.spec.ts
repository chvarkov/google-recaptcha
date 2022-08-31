import { GoogleRecaptchaException, GoogleRecaptchaGuard, GoogleRecaptchaModuleOptions } from '../src';
import { Reflector } from '@nestjs/core';
import { GoogleRecaptchaGuardOptions } from '../src/interfaces/google-recaptcha-guard-options';
import { createGoogleRecaptchaValidator } from './helpers/create-google-recaptcha-validator';
import { GoogleRecaptchaValidatorOptions } from '../src/interfaces/google-recaptcha-validator-options';
import { createExecutionContext } from './helpers/create-execution-context';
import { TestController } from './assets/test-controller';
import { TestRecaptchaNetwork } from './network/test-recaptcha-network';
import { RecaptchaRequestResolver } from '../src/services/recaptcha-request.resolver';
import { Logger } from '@nestjs/common';
import { createGoogleRecaptchaEnterpriseValidator } from './helpers/create-google-recaptcha-enterprise-validator';
import { RecaptchaValidatorResolver } from '../src/services/recaptcha-validator.resolver';

describe('Google recaptcha guard', () => {
	let network: TestRecaptchaNetwork;
	const networkPort = 6048;
	const validatorOptions: GoogleRecaptchaValidatorOptions = {
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
		const validatorResolver = new RecaptchaValidatorResolver(options, validator, enterpriseValidator);

		const guard = new GoogleRecaptchaGuard(new Reflector(), new RecaptchaRequestResolver(), validatorResolver, new Logger(), {
			...options,
			skipIf: true,
		});

		const context = createExecutionContext(controller.submit, { body: { recaptcha: 'RECAPTCHA_TOKEN' } });

		const canActivate = await guard.canActivate(context);

		expect(canActivate).toBeTruthy();
	});

	test('SkipIf = (req) => true + overridden response provider', async () => {
		const options = { ...validatorOptions, ...guardOptions };
		const validator = createGoogleRecaptchaValidator(options);
		const enterpriseValidator = createGoogleRecaptchaEnterpriseValidator(options);
		const validatorResolver = new RecaptchaValidatorResolver(options, validator, enterpriseValidator);

		const guard = new GoogleRecaptchaGuard(new Reflector(), new RecaptchaRequestResolver(), validatorResolver, new Logger(), {
			...options,
			skipIf: (): boolean => true,
		});

		const context = createExecutionContext(controller.submitOverridden.prototype, { body: { recaptcha: 'RECAPTCHA_TOKEN' } });

		const canActivate = await guard.canActivate(context);

		expect(canActivate).toBeTruthy();
	});

	test('Invalid secret', async () => {
		const options = { ...validatorOptions, ...guardOptions };
		const validator = createGoogleRecaptchaValidator(options);
		const enterpriseValidator = createGoogleRecaptchaEnterpriseValidator(options);
		const validatorResolver = new RecaptchaValidatorResolver(options, validator, enterpriseValidator);

		const guard = new GoogleRecaptchaGuard(new Reflector(), new RecaptchaRequestResolver(), validatorResolver, new Logger(), options);

		const context = createExecutionContext(controller.submit, { body: { recaptcha: 'RECAPTCHA_TOKEN' } });

		await guard
			.canActivate(context)
			.then(() => expect(true).toBeFalsy())
			.catch((e) => expect(e).toBeInstanceOf(GoogleRecaptchaException));
	});

	test('Invalid network', async () => {
		const options = {
			...validatorOptions,
			...guardOptions,
			network: 'https://localhost/some-invalid-path',
		};

		const validator = createGoogleRecaptchaValidator(options);
		const enterpriseValidator = createGoogleRecaptchaEnterpriseValidator(options);
		const validatorResolver = new RecaptchaValidatorResolver(options, validator, enterpriseValidator);

		const guard = new GoogleRecaptchaGuard(new Reflector(), new RecaptchaRequestResolver(), validatorResolver, new Logger(), {
			...guardOptions,
			...validatorOptions,
		});

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
			network: network.url,
		};

		const validator = createGoogleRecaptchaValidator(options);
		const enterpriseValidator = createGoogleRecaptchaEnterpriseValidator(options);
		const validatorResolver = new RecaptchaValidatorResolver(options, validator, enterpriseValidator);

		const guard = new GoogleRecaptchaGuard(new Reflector(), new RecaptchaRequestResolver(), validatorResolver, new Logger(), options);

		const context = createExecutionContext(controller.submit, { body: { recaptcha: 'RECAPTCHA_TOKEN' } });

		const canActivate = await guard.canActivate(context);

		expect(canActivate).toBeTruthy();
	});

	test('Unsupported request type', async () => {
		const options = {} as GoogleRecaptchaModuleOptions;

		const validator = createGoogleRecaptchaValidator(options);
		const enterpriseValidator = createGoogleRecaptchaEnterpriseValidator(options);
		const validatorResolver = new RecaptchaValidatorResolver(options, validator, enterpriseValidator);

		const guard = new GoogleRecaptchaGuard(new Reflector(), new RecaptchaRequestResolver(), validatorResolver, new Logger(), options);

		const context = createExecutionContext(controller.submit, { body: { recaptcha: 'RECAPTCHA_TOKEN' } });

		Object.assign(context, { getType: () => 'unknown' });

		await expect(guard.canActivate(context)).rejects.toThrowError('Unsupported request type');
	});
});

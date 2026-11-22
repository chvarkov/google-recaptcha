import { Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
	ErrorCode,
	GoogleRecaptchaException,
	GoogleRecaptchaGuard,
	GoogleRecaptchaModuleOptions,
	GoogleRecaptchaV3ModuleOptions,
	Recaptcha,
} from '../src';
import { RecaptchaRequestResolver } from '../src/services/recaptcha-request.resolver';
import { RecaptchaValidatorResolver } from '../src/services/recaptcha-validator.resolver';
import { RecaptchaConfigRef } from '../src/models/recaptcha-config-ref';
import { createGoogleRecaptchaValidator } from './helpers/create-google-recaptcha-validator';
import { createGoogleRecaptchaEnterpriseValidator } from './helpers/create-google-recaptcha-enterprise-validator';
import { createExecutionContext } from './helpers/create-execution-context';
import { TestRecaptchaNetwork } from './network/test-recaptcha-network';
import { LiteralObject } from './utils/literal-object';

@Recaptcha({ action: 'Login' })
class ClassLevelController {
	@Recaptcha()
	inherited(): void {
		return;
	}

	@Recaptcha({ action: 'Register' })
	overridden(): void {
		return;
	}
}

class PlainController {
	@Recaptcha({ score: 0 })
	zeroScore(): void {
		return;
	}
}

describe('Google recaptcha guard: decorator options', () => {
	let network: TestRecaptchaNetwork;

	beforeAll(async () => {
		network = await TestRecaptchaNetwork.create(6049);
	});

	afterAll(() => network.close());

	function createGuard(extra: Partial<GoogleRecaptchaV3ModuleOptions> = {}): GoogleRecaptchaGuard {
		const options: GoogleRecaptchaModuleOptions = {
			secretKey: 'Secret',
			response: (req) => req.body.recaptcha,
			siteVerifyUrl: network.url,
			...extra,
		};
		const configRef = new RecaptchaConfigRef(options);
		const validatorResolver = new RecaptchaValidatorResolver(
			configRef,
			createGoogleRecaptchaValidator(options),
			createGoogleRecaptchaEnterpriseValidator(options)
		);

		return new GoogleRecaptchaGuard(new Reflector(), new RecaptchaRequestResolver(), validatorResolver, new Logger(), configRef);
	}

	function v3(action: string, score = 0.9): void {
		network.setResult({ success: true, action, score, hostname: 'localhost' });
	}

	const req = { body: { recaptcha: 'TOKEN' } };

	test('Class-level options are applied to handler without options', async () => {
		const ctx = createExecutionContext(ClassLevelController.prototype.inherited, req, 'http', ClassLevelController);

		v3('Login');
		await expect(createGuard().canActivate(ctx)).resolves.toBe(true);

		v3('Register');
		await expect(createGuard().canActivate(ctx)).rejects.toMatchObject({ errorCodes: [ErrorCode.ForbiddenAction] });
	});

	test('Handler-level options override class-level ones', async () => {
		const ctx = createExecutionContext(ClassLevelController.prototype.overridden, req, 'http', ClassLevelController);

		v3('Register');
		await expect(createGuard().canActivate(ctx)).resolves.toBe(true);

		v3('Login');
		await expect(createGuard().canActivate(ctx)).rejects.toBeInstanceOf(GoogleRecaptchaException);
	});

	test('Decorator score 0 is not replaced by module score', async () => {
		const ctx = createExecutionContext(PlainController.prototype.zeroScore, req, 'http', PlainController);

		v3('Submit', 0.1);
		await expect(createGuard({ score: 0.9 }).canActivate(ctx)).resolves.toBe(true);
	});

	test('Module remoteIp provider result is passed to validator', async () => {
		const request: LiteralObject = { body: { recaptcha: 'TOKEN' } };
		const ctx = createExecutionContext(PlainController.prototype.zeroScore, request, 'http', PlainController);

		v3('Submit');
		await createGuard({ remoteIp: async () => '10.0.0.1' }).canActivate(ctx);

		expect(request['recaptchaValidationResult'].remoteIp).toBe('10.0.0.1');
	});
});

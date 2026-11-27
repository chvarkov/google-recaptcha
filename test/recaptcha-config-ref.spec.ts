import { GoogleRecaptchaModuleOptions, GoogleRecaptchaRuntimeOptions } from '../src/index.js';
import { RecaptchaConfigRef } from '../src/models/recaptcha-config-ref.js';
import { GoogleRecaptchaEnterpriseOptions } from '../src/interfaces/google-recaptcha-enterprise-options.js';

describe('RecaptchaConfigRef', () => {
	const options: GoogleRecaptchaModuleOptions = {
		type: 'v3',
		secretKey: 'SECRET',
		response: () => 'RESPONSE',
	};

	test('setSecretKey', () => {
		const ref = new RecaptchaConfigRef(options);
		expect(ref.valueOf.secretKey).toBe(options.secretKey);

		ref.setSecretKey('NEW_ONE');
		expect(ref.valueOf.secretKey).toBe('NEW_ONE');
		expect(options.secretKey).toBe('SECRET');

		expect(ref.valueOf.enterprise).toBeUndefined();
	});

	test('setEnterpriseOptions', () => {
		const ref = new RecaptchaConfigRef(options);
		expect(ref.valueOf.secretKey).toBe(options.secretKey);

		const eOpts: GoogleRecaptchaEnterpriseOptions = {
			apiKey: 'e_api_key',
			projectId: 'e_project_id',
			siteKey: 'e_site_key',
		};

		ref.setEnterpriseOptions(eOpts);
		expect(ref.valueOf.enterprise?.apiKey).toBe(eOpts.apiKey);
		expect(ref.valueOf.enterprise?.projectId).toBe(eOpts.projectId);
		expect(ref.valueOf.enterprise?.siteKey).toBe(eOpts.siteKey);
		expect(ref.valueOf.secretKey).toBeUndefined();

		expect(options.enterprise).toBeUndefined();
		expect(options.secretKey).toBe('SECRET');
	});

	test('setEnterpriseOptions sets type and resets v2/v3 options', () => {
		const ref = new RecaptchaConfigRef({
			type: 'v2',
			response: () => 'RESPONSE',
			secretKey: 'SECRET',
			siteVerifyUrl: 'https://proxy.local',
		});

		ref.setEnterpriseOptions({ apiKey: 'k', projectId: 'p', siteKey: 's' });

		expect(ref.valueOf.type).toBe('enterprise');
		expect(ref.valueOf.secretKey).toBeUndefined();
		expect(ref.valueOf.siteVerifyUrl).toBeUndefined();
	});

	test('setSecretKey keeps v2/v3 type and switches Enterprise to v3', () => {
		const v2 = new RecaptchaConfigRef({ type: 'v2', response: () => 'RESPONSE', secretKey: 'SECRET' }).setSecretKey('NEW');
		expect(v2.valueOf.type).toBe('v2');
		expect(v2.valueOf.secretKey).toBe('NEW');

		const v3 = new RecaptchaConfigRef(options).setSecretKey('NEW');
		expect(v3.valueOf.type).toBe('v3');

		const ent = new RecaptchaConfigRef({
			type: 'enterprise',
			response: () => 'RESPONSE',
			enterprise: { apiKey: 'k', projectId: 'p', siteKey: 's' },
		});
		ent.setSecretKey('NEW');
		expect(ent.valueOf.type).toBe('v3');
		expect(ent.valueOf.secretKey).toBe('NEW');
		expect(ent.valueOf.enterprise).toBeUndefined();
	});

	test('setScore throws for v2', () => {
		const ref = new RecaptchaConfigRef({ type: 'v2', response: () => 'RESPONSE', secretKey: 'SECRET' });

		expect(() => ref.setScore(0.5)).toThrow('Score is not supported for reCAPTCHA v2.');
		expect(ref.valueOf.score).toBeUndefined();
	});

	test('setScore', () => {
		const ref = new RecaptchaConfigRef(options);
		expect(ref.valueOf.secretKey).toBe(options.secretKey);

		ref.setScore(0.5);
		expect(ref.valueOf.score).toBe(0.5);
		expect(options.score).toBeUndefined();
	});

	test('setSkipIf', () => {
		const ref = new RecaptchaConfigRef(options);
		expect(ref.valueOf.secretKey).toBe(options.secretKey);

		ref.setSkipIf(true);
		expect(ref.valueOf.skipIf).toBeTruthy();
		expect(options.skipIf).toBeUndefined();
	});

	describe('setOptions', () => {
		const enterprise: GoogleRecaptchaEnterpriseOptions = { apiKey: 'k', projectId: 'p', siteKey: 's' };
		const skipIf = (): boolean => false;
		const remoteIp = (): string => '127.0.0.1';

		test('switches v3 => v2 and resets score/actions', () => {
			const ref = new RecaptchaConfigRef({ ...options, score: 0.5, actions: ['login'], skipIf, remoteIp, debug: true });

			ref.setOptions({ type: 'v2', secretKey: 'V2_SECRET' });

			expect(ref.valueOf.type).toBe('v2');
			expect(ref.valueOf.secretKey).toBe('V2_SECRET');
			expect(ref.valueOf.score).toBeUndefined();
			expect(ref.valueOf.actions).toBeUndefined();

			// Non type-dependent options are kept.
			expect(ref.valueOf.response).toBe(options.response);
			expect(ref.valueOf.skipIf).toBe(skipIf);
			expect(ref.valueOf.remoteIp).toBe(remoteIp);
			expect(ref.valueOf.debug).toBe(true);
		});

		test('switches v2 => v3', () => {
			const ref = new RecaptchaConfigRef({ type: 'v2', response: () => 'RESPONSE', secretKey: 'V2_SECRET' });

			ref.setOptions({ type: 'v3', secretKey: 'V3_SECRET', score: 0.7, actions: ['login'], siteVerifyUrl: 'https://proxy.local' });

			expect(ref.valueOf).toMatchObject({
				type: 'v3',
				secretKey: 'V3_SECRET',
				score: 0.7,
				actions: ['login'],
				siteVerifyUrl: 'https://proxy.local',
			});
		});

		test('switches v2 => Enterprise and back to v2', () => {
			const ref = new RecaptchaConfigRef({
				type: 'v2',
				response: () => 'RESPONSE',
				secretKey: 'SECRET',
				siteVerifyUrl: 'https://proxy.local',
			});

			ref.setOptions({ type: 'enterprise', enterprise, score: 0.5 });

			expect(ref.valueOf.type).toBe('enterprise');
			expect(ref.valueOf.enterprise).toEqual(enterprise);
			expect(ref.valueOf.secretKey).toBeUndefined();
			expect(ref.valueOf.siteVerifyUrl).toBeUndefined();

			ref.setOptions({ type: 'v2', secretKey: 'V2_SECRET' });

			expect(ref.valueOf.type).toBe('v2');
			expect(ref.valueOf.enterprise).toBeUndefined();
			expect(ref.valueOf.score).toBeUndefined();
		});

		test('replaces the options object and does not mutate the original one', () => {
			const ref = new RecaptchaConfigRef(options);
			const before = ref.valueOf;

			ref.setOptions({ type: 'v2', secretKey: 'V2_SECRET' });

			expect(ref.valueOf).not.toBe(before);
			expect(before.type).toBe('v3');
			expect(options).toEqual({ type: 'v3', secretKey: 'SECRET', response: options.response });
		});

		test('ignores options that are not runtime-changeable', () => {
			const ref = new RecaptchaConfigRef(options);
			const response = (): string => 'OTHER';

			// JS users / untyped configs.
			ref.setOptions({ type: 'v2', secretKey: 'V2_SECRET', response } as unknown as GoogleRecaptchaRuntimeOptions);

			expect(ref.valueOf.response).toBe(options.response);
		});

		test.each([
			[{ type: 'v2', secretKey: 'S', score: 0.5 }, 'Google reCAPTCHA v2 does not support "score" and "actions" options.'],
			[{ type: 'v2', secretKey: 'S', actions: ['login'] }, 'Google reCAPTCHA v2 does not support "score" and "actions" options.'],
			[{ type: 'v3', secretKey: '' }, 'Google reCAPTCHA options must contain either "secretKey" or "enterprise", but not both.'],
			[
				{ type: 'v3', secretKey: 'S', enterprise },
				'Google reCAPTCHA options must contain either "secretKey" or "enterprise", but not both.',
			],
			[{ type: 'enterprise', secretKey: 'S' }, 'Google reCAPTCHA type \'enterprise\' requires the "enterprise" option.'],
			[{ type: 'v2', enterprise }, 'Google reCAPTCHA type \'v2\' requires the "secretKey" option.'],
			[{ secretKey: 'S' }, 'Google reCAPTCHA option "type" is required. Expected one of: v2, v3, enterprise.'],
			[{ type: 'v4', secretKey: 'S' }, "Unknown Google reCAPTCHA type 'v4'. Expected one of: v2, v3, enterprise."],
		])('throws for invalid options %j and keeps the current config', (invalid, message) => {
			const ref = new RecaptchaConfigRef({ ...options, score: 0.5 });
			const before = ref.valueOf;

			expect(() => ref.setOptions(invalid as unknown as GoogleRecaptchaRuntimeOptions)).toThrow(message);
			expect(ref.valueOf).toBe(before);
		});

		test('types', () => {
			const ref = new RecaptchaConfigRef(options);

			// @ts-expect-error v2 has no score
			expect(() => ref.setOptions({ type: 'v2', secretKey: 'S', score: 0.5 })).toThrow();

			// @ts-expect-error Enterprise requires enterprise options
			expect(() => ref.setOptions({ type: 'enterprise', secretKey: 'S' })).toThrow();

			// @ts-expect-error type is required
			expect(() => ref.setOptions({ secretKey: 'S' })).toThrow();

			// @ts-expect-error response is not runtime-changeable
			ref.setOptions({ type: 'v3', secretKey: 'S', response: () => 'R' });
		});
	});

	describe('not configured (forRootDeferred)', () => {
		const deferred = (): RecaptchaConfigRef => new RecaptchaConfigRef({ response: () => 'RESPONSE', whenNotConfigured: 'skip' });

		test('isConfigured / whenNotConfigured', () => {
			const ref = deferred();

			expect(ref.isConfigured).toBe(false);
			expect(ref.whenNotConfigured).toBe('skip');
			expect(new RecaptchaConfigRef(options).isConfigured).toBe(true);
			expect(new RecaptchaConfigRef(options).whenNotConfigured).toBe('reject');

			ref.setOptions({ type: 'v2', secretKey: 'S' });
			expect(ref.isConfigured).toBe(true);
		});

		test('clear() resets keys and keeps other options', () => {
			const skipIf = (): boolean => false;
			const ref = new RecaptchaConfigRef({ ...options, score: 0.5, actions: ['login'], skipIf, debug: true });

			ref.clear();

			expect(ref.isConfigured).toBe(false);
			for (const key of ['type', 'secretKey', 'siteVerifyUrl', 'enterprise', 'score', 'actions'] as const) {
				expect(ref.valueOf[key]).toBeUndefined();
			}
			expect(ref.valueOf.response).toBe(options.response);
			expect(ref.valueOf.skipIf).toBe(skipIf);
			expect(ref.valueOf.debug).toBe(true);
		});

		test('setSecretKey / setScore throw: v2 or v3 is ambiguous', () => {
			const ref = deferred();

			expect(() => ref.setSecretKey('S')).toThrow(
				'Google reCAPTCHA is not configured: setSecretKey() cannot be used before setOptions().'
			);
			expect(() => ref.setScore(0.5)).toThrow('Google reCAPTCHA is not configured: setScore() cannot be used before setOptions().');
			expect(ref.isConfigured).toBe(false);
		});

		test('setEnterpriseOptions configures Enterprise', () => {
			const ref = deferred().setEnterpriseOptions({ apiKey: 'k', projectId: 'p', siteKey: 's' });

			expect(ref.isConfigured).toBe(true);
			expect(ref.valueOf.type).toBe('enterprise');
		});

		test('setSkipIf works while not configured', () => {
			const ref = deferred().setSkipIf(true);

			expect(ref.valueOf.skipIf).toBe(true);
			expect(ref.isConfigured).toBe(false);
		});
	});

	test('unsupportedChecks is kept by setOptions() / clear()', () => {
		const ref = new RecaptchaConfigRef({ ...options, unsupportedChecks: 'ignore' });

		ref.setOptions({ type: 'v2', secretKey: 'S' });
		expect(ref.valueOf.unsupportedChecks).toBe('ignore');

		ref.clear();
		expect(ref.valueOf.unsupportedChecks).toBe('ignore');
	});

	test('types: unsupportedChecks is not a runtime option', () => {
		const ref = new RecaptchaConfigRef(options);

		// @ts-expect-error set in module options
		ref.setOptions({ type: 'v2', secretKey: 'S', unsupportedChecks: 'ignore' });

		expect(ref.valueOf.unsupportedChecks).toBeUndefined();
	});
});

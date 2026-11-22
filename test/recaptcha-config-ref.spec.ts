import { GoogleRecaptchaModuleOptions } from '../src';
import { RecaptchaConfigRef } from '../src/models/recaptcha-config-ref';
import { GoogleRecaptchaEnterpriseOptions } from '../src/interfaces/google-recaptcha-enterprise-options';

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
});

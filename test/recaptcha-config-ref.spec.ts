import { GoogleRecaptchaModuleOptions } from '../src';
import { RecaptchaConfigRef } from '../src/models/recaptcha-config-ref';
import { GoogleRecaptchaEnterpriseOptions } from '../src/interfaces/google-recaptcha-enterprise-options';

describe('RecaptchaConfigRef', () => {
	const options: GoogleRecaptchaModuleOptions = {
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
		expect(ref.valueOf.enterprise.apiKey).toBe(eOpts.apiKey);
		expect(ref.valueOf.enterprise.projectId).toBe(eOpts.projectId);
		expect(ref.valueOf.enterprise.siteKey).toBe(eOpts.siteKey);
		expect(ref.valueOf.secretKey).toBeUndefined();

		expect(options.enterprise).toBeUndefined();
		expect(options.secretKey).toBe('SECRET');
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

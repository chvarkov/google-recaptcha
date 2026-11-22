import { Test } from '@nestjs/testing';
import {
	GoogleRecaptchaEnterpriseModuleOptions,
	GoogleRecaptchaModule,
	GoogleRecaptchaModuleOptions,
	GoogleRecaptchaSiteVerifyUrl,
	GoogleRecaptchaV2ModuleOptions,
	GoogleRecaptchaV3ModuleOptions,
} from '../src';

const response = (): string => 'token';
const enterprise = { projectId: 'p', siteKey: 's', apiKey: 'k' };

const compile = (options: GoogleRecaptchaModuleOptions) =>
	Test.createTestingModule({ imports: [GoogleRecaptchaModule.forRoot(options)] }).compile();

// Compile-time checks run by `test:types`; runtime assertions only keep the values used.
describe('GoogleRecaptchaModuleOptions: types', () => {
	test('valid variants', () => {
		const v2: GoogleRecaptchaModuleOptions = {
			type: 'v2',
			response,
			secretKey: 'secret',
			siteVerifyUrl: GoogleRecaptchaSiteVerifyUrl.Recaptcha,
		};
		const v3: GoogleRecaptchaModuleOptions = { type: 'v3', response, secretKey: 'secret', score: 0.5, actions: ['login'] };
		const v3Implicit: GoogleRecaptchaModuleOptions = { response, secretKey: 'secret', score: 0.5 };
		const ent: GoogleRecaptchaModuleOptions = { type: 'enterprise', response, enterprise, score: 0.5, actions: ['login'] };
		const entImplicit: GoogleRecaptchaModuleOptions = { response, enterprise };
		const asyncV2 = GoogleRecaptchaModule.forRootAsync({ useFactory: () => ({ type: 'v2' as const, response, secretKey: 'secret' }) });

		expect([v2, v3, v3Implicit, ent, entImplicit, asyncV2]).toHaveLength(6);
	});

	test('invalid combinations', () => {
		// @ts-expect-error v2 has no score
		const v2Score: GoogleRecaptchaModuleOptions = { type: 'v2', response, secretKey: 'secret', score: 0.5 };

		// @ts-expect-error v2 has no actions
		const v2Actions: GoogleRecaptchaModuleOptions = { type: 'v2', response, secretKey: 'secret', actions: ['login'] };

		// @ts-expect-error v2 requires secretKey
		const v2Enterprise: GoogleRecaptchaModuleOptions = { type: 'v2', response, enterprise };

		// @ts-expect-error enterprise requires enterprise options
		const entSecret: GoogleRecaptchaModuleOptions = { type: 'enterprise', response, secretKey: 'secret' };

		// @ts-expect-error siteVerifyUrl is not used by Enterprise
		const entUrl: GoogleRecaptchaModuleOptions = { response, enterprise, siteVerifyUrl: GoogleRecaptchaSiteVerifyUrl.Google };

		// @ts-expect-error secretKey and enterprise together
		const both: GoogleRecaptchaModuleOptions = { response, secretKey: 'secret', enterprise };

		// @ts-expect-error unknown type
		const unknownType: GoogleRecaptchaModuleOptions = { type: 'v4', response, secretKey: 'secret' };

		expect([v2Score, v2Actions, v2Enterprise, entSecret, entUrl, both, unknownType]).toHaveLength(7);
	});

	test('narrowing by type', () => {
		const narrow = (options: GoogleRecaptchaModuleOptions): string => {
			switch (options.type) {
				case 'v2': {
					const v2: GoogleRecaptchaV2ModuleOptions = options;
					return v2.secretKey;
				}
				case 'enterprise': {
					const ent: GoogleRecaptchaEnterpriseModuleOptions = options;
					return ent.enterprise.projectId;
				}
				default: {
					// 'v3' or no type: v3 or Enterprise without explicit type.
					const rest: GoogleRecaptchaV3ModuleOptions | GoogleRecaptchaEnterpriseModuleOptions = options;
					return rest.secretKey ?? rest.enterprise?.projectId ?? '';
				}
			}
		};

		expect(narrow({ type: 'v2', response, secretKey: 'secret' })).toBe('secret');
		expect(narrow({ type: 'enterprise', response, enterprise })).toBe('p');
		expect(narrow({ response, enterprise })).toBe('p');
	});
});

describe('GoogleRecaptchaModuleOptions: runtime validation (JS users)', () => {
	const invalid = (options: object) => compile(options as GoogleRecaptchaModuleOptions);

	test('valid configs', async () => {
		await expect(compile({ type: 'v2', response, secretKey: 'secret' })).resolves.toBeDefined();
		await expect(compile({ type: 'v3', response, secretKey: 'secret', score: 0 })).resolves.toBeDefined();
		await expect(compile({ type: 'enterprise', response, enterprise })).resolves.toBeDefined();
	});

	test('unknown type', async () => {
		await expect(invalid({ type: 'v4', response, secretKey: 'secret' })).rejects.toThrow(
			"Unknown Google reCAPTCHA type 'v4'. Expected one of: v2, v3, enterprise."
		);
	});

	test('type does not match options', async () => {
		await expect(invalid({ type: 'enterprise', response, secretKey: 'secret' })).rejects.toThrow(
			'Google reCAPTCHA type \'enterprise\' requires the "enterprise" option.'
		);
		await expect(invalid({ type: 'v2', response, enterprise })).rejects.toThrow(
			'Google reCAPTCHA type \'v2\' requires the "secretKey" option.'
		);
	});

	test('v2 with score or actions', async () => {
		const message = 'Google reCAPTCHA v2 does not support "score" and "actions" options.';

		await expect(invalid({ type: 'v2', response, secretKey: 'secret', score: 0 })).rejects.toThrow(message);
		await expect(invalid({ type: 'v2', response, secretKey: 'secret', actions: [] })).rejects.toThrow(message);
	});
});

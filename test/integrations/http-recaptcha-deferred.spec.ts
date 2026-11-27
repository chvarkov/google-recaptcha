import { Controller, INestApplication, Post } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Request } from 'express';
import {
	ErrorCode,
	GoogleRecaptchaDeferredModuleOptions,
	GoogleRecaptchaModule,
	Recaptcha,
	RecaptchaConfigRef,
	RecaptchaResult,
	RecaptchaVerificationResult,
} from '../../src/index.js';
import { MockedRecaptchaApi } from '../utils/mocked-recaptcha-api.js';
import { VerifyResponseV2, VerifyResponseV3 } from '../../src/interfaces/verify-response.js';
import { TestHttp } from '../utils/test-http.js';
import { TestErrorFilter } from '../assets/test-error-filter.js';
import { RECAPTCHA_AXIOS_INSTANCE } from '../../src/provider.declarations.js';
import { LiteralObject } from '../utils/literal-object.js';

@Controller('test')
class TestDeferredController {
	@Recaptcha()
	@Post('submit')
	submit(@RecaptchaResult() result?: RecaptchaVerificationResult): LiteralObject {
		return { verified: !!result, success: result?.success };
	}
}

const v2Response = (): VerifyResponseV2 => ({
	success: true,
	hostname: 'hostname',
	challenge_ts: new Date().toISOString(),
	errors: [],
});

async function createApp(
	options: Omit<GoogleRecaptchaDeferredModuleOptions, 'response'>,
	api: MockedRecaptchaApi
): Promise<{ app: INestApplication; http: TestHttp; configRef: RecaptchaConfigRef }> {
	const module = await Test.createTestingModule({
		imports: [
			GoogleRecaptchaModule.forRootDeferred({
				...options,
				response: (req: Request): string | undefined => req.headers.recaptcha?.toString(),
			}),
		],
		controllers: [TestDeferredController],
	})
		.overrideProvider(RECAPTCHA_AXIOS_INSTANCE)
		.useFactory({ factory: () => api.getAxios() })
		.compile();

	const app = module.createNestApplication();
	app.useGlobalFilters(new TestErrorFilter());
	await app.init();

	return { app, http: new TestHttp(app.getHttpServer()), configRef: app.get(RecaptchaConfigRef) };
}

describe('HTTP Recaptcha: forRootDeferred()', () => {
	describe("whenNotConfigured: 'reject' (default)", () => {
		const api = new MockedRecaptchaApi();

		let app: INestApplication;
		let http: TestHttp;
		let configRef: RecaptchaConfigRef;

		beforeAll(async () => ({ app, http, configRef } = await createApp({}, api)));

		afterAll(() => app.close());

		test('rejects until configured, verifies after setOptions(), rejects again after clear()', async () => {
			expect(configRef.isConfigured).toBe(false);
			expect(configRef.whenNotConfigured).toBe('reject');

			const notConfigured = await http.post('/test/submit', {}, { headers: { Recaptcha: 'any' } });

			expect(notConfigured.statusCode).toBe(500);
			expect(notConfigured.body.errorCodes).toEqual([ErrorCode.NotConfigured]);

			configRef.setOptions({ type: 'v2', secretKey: 'v2_secret' });
			api.addResponse<VerifyResponseV2>('deferred_v2', v2Response());

			const v2 = await http.post('/test/submit', {}, { headers: { Recaptcha: 'deferred_v2' } });

			expect(v2.statusCode).toBe(201);
			expect(v2.body).toEqual({ verified: true, success: true });

			configRef.setOptions({ type: 'v3', secretKey: 'v3_secret', score: 0.5, actions: ['Submit'] });
			api.addResponse<VerifyResponseV3>('deferred_v3_low', { ...v2Response(), score: 0.1, action: 'Submit' });

			const v3 = await http.post('/test/submit', {}, { headers: { Recaptcha: 'deferred_v3_low' } });

			expect(v3.statusCode).toBe(400);
			expect(v3.body.errorCodes).toEqual([ErrorCode.LowScore]);

			configRef.clear();

			const cleared = await http.post('/test/submit', {}, { headers: { Recaptcha: 'any' } });

			expect(cleared.statusCode).toBe(500);
			expect(cleared.body.errorCodes).toEqual([ErrorCode.NotConfigured]);
		});
	});

	describe("whenNotConfigured: 'skip'", () => {
		const api = new MockedRecaptchaApi();

		let app: INestApplication;
		let http: TestHttp;
		let configRef: RecaptchaConfigRef;

		beforeAll(async () => ({ app, http, configRef } = await createApp({ whenNotConfigured: 'skip' }, api)));

		afterAll(() => app.close());

		test('skips verification until configured', async () => {
			// No mocked response: a request to the API would fail the test.
			const skipped = await http.post('/test/submit', {}, { headers: { Recaptcha: 'no_mock' } });

			expect(skipped.statusCode).toBe(201);
			expect(skipped.body).toEqual({ verified: false });

			configRef.setOptions({ type: 'v2', secretKey: 'v2_secret' });
			api.addResponse('deferred_invalid', { success: false, 'error-codes': [ErrorCode.InvalidInputResponse] });

			const verified = await http.post('/test/submit', {}, { headers: { Recaptcha: 'deferred_invalid' } });

			expect(verified.statusCode).toBe(400);
			expect(verified.body.errorCodes).toEqual([ErrorCode.InvalidInputResponse]);
		});
	});
});

import { Controller, INestApplication, Post } from '@nestjs/common';
import {
	ErrorCode,
	GoogleRecaptchaModule,
	Recaptcha,
	RecaptchaConfigRef,
	RecaptchaResult,
	RecaptchaVerificationResult,
} from '../../src/index.js';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import request from 'supertest';
import { MockedRecaptchaApi } from '../utils/mocked-recaptcha-api.js';
import { VerifyResponseV2, VerifyResponseV3 } from '../../src/interfaces/verify-response.js';
import { TestHttp } from '../utils/test-http.js';
import { TestErrorFilter } from '../assets/test-error-filter.js';
import { RECAPTCHA_AXIOS_INSTANCE } from '../../src/provider.declarations.js';
import { LiteralObject } from '../utils/literal-object.js';

@Controller('test')
class TestController {
	@Recaptcha()
	@Post('submit')
	testAction(@RecaptchaResult() result: RecaptchaVerificationResult): LiteralObject {
		expect(result).toBeInstanceOf(RecaptchaVerificationResult);
		expect(result.success).toBeTruthy();
		expect(result.remoteIp).toBe('IP_ADDR');

		expect(result.getResponse()).toBeDefined();

		const riskAnalytics = result.getEnterpriseRiskAnalytics();

		expect(riskAnalytics).toBeNull();

		return { success: true };
	}
}

describe('HTTP Recaptcha V2 V3', () => {
	const mockedRecaptchaApi = new MockedRecaptchaApi();

	let http: TestHttp;

	let module: TestingModule;
	let app: INestApplication;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				GoogleRecaptchaModule.forRoot({
					debug: true,
					response: (req: Request): string | undefined => req.headers.recaptcha?.toString(),
					type: 'v3',
					secretKey: 'secret_key',
					score: 0.6,
					actions: ['Submit'],
					remoteIp: () => 'IP_ADDR',
				}),
			],
			controllers: [TestController],
		})
			.overrideProvider(RECAPTCHA_AXIOS_INSTANCE)
			.useFactory({
				factory: () => mockedRecaptchaApi.getAxios(),
			})
			.compile();

		app = module.createNestApplication();

		app.useGlobalFilters(new TestErrorFilter());

		await app.init();

		http = new TestHttp(app.getHttpServer());
	});

	afterAll(() => app.close());

	test('V2 response is rejected by v3 config (no action and score)', async () => {
		mockedRecaptchaApi.addResponse<VerifyResponseV2>('test_v2_on_v3', {
			success: true,
			hostname: 'hostname',
			challenge_ts: new Date().toISOString(),
			errors: [],
		});

		const res: request.Response = await http.post(
			'/test/submit',
			{},
			{
				headers: {
					Recaptcha: 'test_v2_on_v3',
				},
			}
		);

		expect(res.statusCode).toBe(400);
		expect(res.body.errorCodes).toEqual([ErrorCode.ForbiddenAction, ErrorCode.LowScore]);
	});

	test('V2 API error', async () => {
		mockedRecaptchaApi.addError<VerifyResponseV2>('test_v2_api_err', {
			statusCode: 400,
		});

		const res: request.Response = await http.post(
			'/test/submit',
			{},
			{
				headers: {
					Recaptcha: 'test_v2_api_err',
				},
			}
		);

		expect(res.statusCode).toBe(500);
		expect(res.body.errorCodes).toBeDefined();
		expect(res.body.errorCodes.length).toBe(1);
		expect(res.body.errorCodes[0]).toBe(ErrorCode.UnknownError);
	});

	test('V2 Network error', async () => {
		mockedRecaptchaApi.addError<VerifyResponseV2>('test_v2_network_err', {
			code: 'ECONNRESET',
		});

		const res: request.Response = await http.post(
			'/test/submit',
			{},
			{
				headers: {
					Recaptcha: 'test_v2_network_err',
				},
			}
		);

		expect(res.statusCode).toBe(500);
	});

	test('V3 OK', async () => {
		mockedRecaptchaApi.addResponse<VerifyResponseV3>('test_v3_ok', {
			success: true,
			hostname: 'hostname',
			challenge_ts: new Date().toISOString(),
			action: 'Submit',
			score: 0.9,
			errors: [],
		});

		const res: request.Response = await http.post(
			'/test/submit',
			{},
			{
				headers: {
					Recaptcha: 'test_v3_ok',
				},
			}
		);

		expect(res.statusCode).toBe(201);
		expect(res.body.success).toBe(true);
	});

	test('V3 Invalid action', async () => {
		mockedRecaptchaApi.addResponse<VerifyResponseV3>('test_v3_invalid_action', {
			success: true,
			hostname: 'hostname',
			challenge_ts: new Date().toISOString(),
			errors: [],
			action: 'InvalidAction',
			score: 0.9,
		});

		const res: request.Response = await http.post(
			'/test/submit',
			{},
			{
				headers: {
					Recaptcha: 'test_v3_invalid_action',
				},
			}
		);

		expect(res.statusCode).toBe(400);
		expect(res.body.errorCodes).toBeDefined();
		expect(res.body.errorCodes.length).toBe(1);
		expect(res.body.errorCodes[0]).toBe(ErrorCode.ForbiddenAction);
	});

	test('V3 Low score', async () => {
		mockedRecaptchaApi.addResponse<VerifyResponseV3>('test_v3_low_score', {
			success: true,
			hostname: 'hostname',
			challenge_ts: new Date().toISOString(),
			errors: [],
			action: 'Submit',
			score: 0.3,
		});

		const res: request.Response = await http.post(
			'/test/submit',
			{},
			{
				headers: {
					Recaptcha: 'test_v3_low_score',
				},
			}
		);

		expect(res.statusCode).toBe(400);
		expect(res.body.errorCodes).toBeDefined();
		expect(res.body.errorCodes.length).toBe(1);
		expect(res.body.errorCodes[0]).toBe(ErrorCode.LowScore);
	});
});

@Controller('test-v2')
class TestV2Controller {
	@Recaptcha()
	@Post('submit')
	submit(@RecaptchaResult() result: RecaptchaVerificationResult): LiteralObject {
		return { success: result.success, score: result.score, action: result.action };
	}

	@Recaptcha({ action: 'Submit' })
	@Post('with-action')
	withAction(): LiteralObject {
		return { success: true };
	}
}

describe('HTTP Recaptcha V2 (type: v2)', () => {
	const mockedRecaptchaApi = new MockedRecaptchaApi();

	let http: TestHttp;
	let app: INestApplication;

	beforeAll(async () => {
		const module = await Test.createTestingModule({
			imports: [
				GoogleRecaptchaModule.forRoot({
					type: 'v2',
					secretKey: 'secret_key',
					response: (req: Request): string | undefined => req.headers.recaptcha?.toString(),
				}),
			],
			controllers: [TestV2Controller],
		})
			.overrideProvider(RECAPTCHA_AXIOS_INSTANCE)
			.useFactory({ factory: () => mockedRecaptchaApi.getAxios() })
			.compile();

		app = module.createNestApplication();
		app.useGlobalFilters(new TestErrorFilter());
		await app.init();

		http = new TestHttp(app.getHttpServer());
	});

	afterAll(() => app.close());

	test('V2 OK: action and score are not checked', async () => {
		mockedRecaptchaApi.addResponse<VerifyResponseV2>('v2_ok', {
			success: true,
			hostname: 'hostname',
			challenge_ts: new Date().toISOString(),
			errors: [],
		});

		const res = await http.post('/test-v2/submit', {}, { headers: { Recaptcha: 'v2_ok' } });

		expect(res.statusCode).toBe(201);
		expect(res.body).toEqual({ success: true });
	});

	test('V2 invalid token: Google error codes are returned as is', async () => {
		mockedRecaptchaApi.addResponse('v2_invalid', {
			success: false,
			'error-codes': [ErrorCode.InvalidInputResponse],
		});

		const res = await http.post('/test-v2/submit', {}, { headers: { Recaptcha: 'v2_invalid' } });

		expect(res.statusCode).toBe(400);
		expect(res.body.errorCodes).toEqual([ErrorCode.InvalidInputResponse]);
	});

	test('Decorator action on v2 config is a misconfiguration', async () => {
		mockedRecaptchaApi.addResponse<VerifyResponseV2>('v2_action', {
			success: true,
			hostname: 'hostname',
			challenge_ts: new Date().toISOString(),
			errors: [],
		});

		const res = await http.post('/test-v2/with-action', {}, { headers: { Recaptcha: 'v2_action' } });

		expect(res.statusCode).toBe(500);
		expect(res.body.message).toBe('Google reCAPTCHA v2 does not support "score" and "action" checks.');
	});
});

describe('HTTP Recaptcha: runtime switch via RecaptchaConfigRef.setOptions()', () => {
	const mockedRecaptchaApi = new MockedRecaptchaApi();

	let http: TestHttp;
	let app: INestApplication;
	let configRef: RecaptchaConfigRef;

	const v2Response: VerifyResponseV2 = {
		success: true,
		hostname: 'hostname',
		challenge_ts: new Date().toISOString(),
		errors: [],
	};

	beforeAll(async () => {
		const module = await Test.createTestingModule({
			imports: [
				GoogleRecaptchaModule.forRoot({
					type: 'v3',
					secretKey: 'v3_secret_key',
					score: 0.6,
					actions: ['Submit'],
					response: (req: Request): string | undefined => req.headers.recaptcha?.toString(),
				}),
			],
			controllers: [TestV2Controller],
		})
			.overrideProvider(RECAPTCHA_AXIOS_INSTANCE)
			.useFactory({ factory: () => mockedRecaptchaApi.getAxios() })
			.compile();

		app = module.createNestApplication();
		app.useGlobalFilters(new TestErrorFilter());
		await app.init();

		configRef = app.get(RecaptchaConfigRef);
		http = new TestHttp(app.getHttpServer());
	});

	afterAll(() => app.close());

	test('v3 => v2 key without restart', async () => {
		mockedRecaptchaApi.addResponse<VerifyResponseV2>('switch_before', v2Response);

		const before = await http.post('/test-v2/submit', {}, { headers: { Recaptcha: 'switch_before' } });

		expect(before.statusCode).toBe(400);
		expect(before.body.errorCodes).toEqual([ErrorCode.ForbiddenAction, ErrorCode.LowScore]);

		configRef.setOptions({ type: 'v2', secretKey: 'v2_secret_key' });

		mockedRecaptchaApi.addResponse<VerifyResponseV2>('switch_after', v2Response);

		const after = await http.post('/test-v2/submit', {}, { headers: { Recaptcha: 'switch_after' } });

		expect(after.statusCode).toBe(201);
		expect(after.body).toEqual({ success: true });
	});
});

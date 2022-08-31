import { Controller, INestApplication, LiteralObject, Post } from '@nestjs/common';
import { GoogleRecaptchaModule, Recaptcha, RecaptchaResult, RecaptchaVerificationResult } from '../../src';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { RECAPTCHA_HTTP_SERVICE } from '../../src/provider.declarations';
import * as request from 'supertest';
import { MockedRecaptchaApi } from '../utils/mocked-recaptcha-api';
import { VerifyResponseV2, VerifyResponseV3 } from '../../src/interfaces/verify-response';
import { TestHttp } from '../utils/test-http';

@Controller('test')
class TestController {
	@Recaptcha()
	@Post('submit')
	testAction(@RecaptchaResult() result: RecaptchaVerificationResult): LiteralObject {
		expect(result).toBeInstanceOf(RecaptchaVerificationResult);
		expect(result.success).toBeTruthy();

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
					response: (req: Request): string => req.headers.recaptcha?.toString(),
					secretKey: 'secret_key',
					score: 0.6,
					actions: ['Submit'],
				}),
			],
			controllers: [TestController],
		})
			.overrideProvider(RECAPTCHA_HTTP_SERVICE)
			.useFactory({
				factory: () => mockedRecaptchaApi.getHttpService(),
			})
			.compile();

		app = module.createNestApplication();

		await app.init();

		http = new TestHttp(app.getHttpServer());
	});

	afterAll(() => app.close());

	test('V2 OK', async () => {
		mockedRecaptchaApi.addResponse<VerifyResponseV2>('test_v2_ok', {
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
					Recaptcha: 'test_v2_ok',
				},
			}
		);

		expect(res.statusCode).toBe(201);
		expect(res.body.success).toBe(true);
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
	});
});

import { Controller, INestApplication, Post } from '@nestjs/common';
import { ClassificationReason, ErrorCode, GoogleRecaptchaModule, Recaptcha, RecaptchaResult, RecaptchaVerificationResult } from '../../src';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import * as request from 'supertest';
import { MockedRecaptchaApi } from '../utils/mocked-recaptcha-api';
import { VerifyResponseV2 } from '../../src/interfaces/verify-response';
import { TestHttp } from '../utils/test-http';
import { VerifyResponseEnterprise } from '../../src/interfaces/verify-response-enterprise';
import { GoogleRecaptchaEnterpriseReason } from '../../src/enums/google-recaptcha-enterprise-reason';
import { TestErrorFilter } from '../assets/test-error-filter';
import { RECAPTCHA_AXIOS_INSTANCE } from '../../src/provider.declarations';
import { LiteralObject } from '../../src/interfaces/literal-object';

@Controller('test')
class TestController {
	@Recaptcha({ response: (req) => req.headers.recaptcha, action: 'Submit', score: 0.7, remoteIp: () => 'IP_ADDR' })
	@Post('submit')
	testAction(@RecaptchaResult() result: RecaptchaVerificationResult): LiteralObject {
		expect(result).toBeInstanceOf(RecaptchaVerificationResult);
		expect(result.success).toBeTruthy();

		expect(result.remoteIp).toBe('IP_ADDR');

		expect(result.getResponse()).toBeDefined();

		const riskAnalytics = result.getEnterpriseRiskAnalytics();

		expect(riskAnalytics).toBeDefined();

		expect(typeof riskAnalytics.score).toBe('number');
		expect(riskAnalytics.reasons).toBeInstanceOf(Array);

		return { success: true };
	}
}

describe('HTTP Recaptcha Enterprise', () => {
	const mockedRecaptchaApi = new MockedRecaptchaApi();

	let http: TestHttp;

	let module: TestingModule;
	let app: INestApplication;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				GoogleRecaptchaModule.forRoot({
					debug: true,
					response: (req: Request): string => req.headers.recaptcha_should_be_overwritten?.toString(),
					enterprise: {
						projectId: 'enterprise_projectId',
						apiKey: 'enterprise_apiKey',
						siteKey: 'enterprise_siteKey',
					},
					score: 0.6,
					actions: ['ShouldBeOverwritten'],
					remoteIp: () => 'SOME_IP',
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

	test('Enterprise OK', async () => {
		mockedRecaptchaApi.addResponse<VerifyResponseEnterprise>('test_enterprise_ok', {
			name: 'name',
			event: {
				userIpAddress: '0.0.0.0',
				siteKey: 'siteKey',
				userAgent: 'UA',
				token: 'token',
				hashedAccountId: '',
				expectedAction: 'Submit',
			},
			tokenProperties: {
				createTime: new Date().toISOString(),
				valid: true,
				action: 'Submit',
				hostname: 'localhost',
			},
			riskAnalysis: {
				reasons: [ClassificationReason.LOW_CONFIDENCE_SCORE],
				score: 0.8,
			},
		});

		const res: request.Response = await http.post(
			'/test/submit',
			{},
			{
				headers: {
					Recaptcha: 'test_enterprise_ok',
				},
			}
		);

		expect(res.statusCode).toBe(201);
		expect(res.body.success).toBe(true);
	});

	test('Enterprise token malformed', async () => {
		mockedRecaptchaApi.addResponse<VerifyResponseEnterprise>('test_enterprise_token_malformed', {
			name: 'name',
			event: {
				userIpAddress: '0.0.0.0',
				siteKey: 'siteKey',
				userAgent: 'UA',
				token: '',
				hashedAccountId: '',
				expectedAction: 'Submit',
			},
			tokenProperties: {
				valid: false,
				invalidReason: GoogleRecaptchaEnterpriseReason.Malformed,
				hostname: '',
				action: '',
				createTime: '1970-01-01T00:00:00Z',
			},
		});

		const res: request.Response = await http.post(
			'/test/submit',
			{},
			{
				headers: {
					Recaptcha: 'test_enterprise_token_malformed',
				},
			}
		);

		expect(res.statusCode).toBe(400);
		expect(res.body.errorCodes).toBeDefined();
		expect(res.body.errorCodes.length).toBe(1);
		expect(res.body.errorCodes[0]).toBe(ErrorCode.InvalidInputResponse);
	});

	test('Enterprise without token properties', async () => {
		mockedRecaptchaApi.addResponse<VerifyResponseEnterprise>('test_enterprise_without_token_props', {
			name: 'name',
			event: {
				userIpAddress: '0.0.0.0',
				siteKey: 'siteKey',
				userAgent: 'UA',
				token: '',
				hashedAccountId: '',
				expectedAction: 'Submit',
			},
		});

		const res: request.Response = await http.post(
			'/test/submit',
			{},
			{
				headers: {
					Recaptcha: 'test_enterprise_without_token_props',
				},
			}
		);

		expect(res.statusCode).toBe(400);

		expect(res.body.errorCodes).toBeDefined();
		expect(res.body.errorCodes.length).toBe(1);
		expect(res.body.errorCodes[0]).toBe(ErrorCode.InvalidInputResponse);
	});

	test('Enterprise API error', async () => {
		mockedRecaptchaApi.addError<VerifyResponseV2>('test_enterprise_api_err', {
			statusCode: 400,
		});

		const res: request.Response = await http.post(
			'/test/submit',
			{},
			{
				headers: {
					Recaptcha: 'test_enterprise_api_err',
				},
			}
		);

		expect(res.statusCode).toBe(500);

		expect(res.body.errorCodes).toBeDefined();
		expect(res.body.errorCodes.length).toBe(1);
		expect(res.body.errorCodes[0]).toBe(ErrorCode.UnknownError);
	});

	test('Enterprise Network error', async () => {
		mockedRecaptchaApi.addNetworkError('test_enterprise_network_err', 'ECONNRESET');

		const res: request.Response = await http.post(
			'/test/submit',
			{},
			{
				headers: {
					Recaptcha: 'test_enterprise_network_err',
				},
			}
		);

		expect(res.statusCode).toBe(500);

		expect(res.body.errorCodes).toBeDefined();
		expect(res.body.errorCodes.length).toBe(1);
		expect(res.body.errorCodes[0]).toBe(ErrorCode.NetworkError);
	});

	test('Enterprise Expired token', async () => {
		mockedRecaptchaApi.addResponse<VerifyResponseEnterprise>('test_enterprise_expired_token', {
			name: 'name',
			event: {
				userIpAddress: '0.0.0.0',
				siteKey: 'siteKey',
				userAgent: 'UA',
				token: 'token',
				hashedAccountId: '',
				expectedAction: 'InvalidAction',
			},
			tokenProperties: {
				createTime: new Date().toISOString(),
				valid: true,
				action: 'InvalidAction',
				hostname: 'localhost',
				invalidReason: GoogleRecaptchaEnterpriseReason.Expired,
			},
			riskAnalysis: {
				reasons: [ClassificationReason.LOW_CONFIDENCE_SCORE],
				score: 0.8,
			},
		});

		const res: request.Response = await http.post(
			'/test/submit',
			{},
			{
				headers: {
					Recaptcha: 'test_enterprise_expired_token',
				},
			}
		);

		expect(res.statusCode).toBe(400);
		expect(res.body.errorCodes).toBeDefined();
		expect(res.body.errorCodes.length).toBe(2);
		expect(res.body.errorCodes[0]).toBe(ErrorCode.TimeoutOrDuplicate);
		expect(res.body.errorCodes[1]).toBe(ErrorCode.ForbiddenAction);
	});

	test('Enterprise Invalid action', async () => {
		mockedRecaptchaApi.addResponse<VerifyResponseEnterprise>('test_enterprise_invalid_action', {
			name: 'name',
			event: {
				userIpAddress: '0.0.0.0',
				siteKey: 'siteKey',
				userAgent: 'UA',
				token: 'token',
				hashedAccountId: '',
				expectedAction: 'InvalidAction',
			},
			tokenProperties: {
				createTime: new Date().toISOString(),
				valid: true,
				action: 'InvalidAction',
				hostname: 'localhost',
			},
			riskAnalysis: {
				reasons: [ClassificationReason.LOW_CONFIDENCE_SCORE],
				score: 0.8,
			},
		});

		const res: request.Response = await http.post(
			'/test/submit',
			{},
			{
				headers: {
					Recaptcha: 'test_enterprise_invalid_action',
				},
			}
		);

		expect(res.statusCode).toBe(400);
	});

	test('Enterprise Low score', async () => {
		mockedRecaptchaApi.addResponse<VerifyResponseEnterprise>('test_enterprise_low_score', {
			name: 'name',
			event: {
				userIpAddress: '0.0.0.0',
				siteKey: 'siteKey',
				userAgent: 'UA',
				token: 'token',
				hashedAccountId: '',
				expectedAction: 'Submit',
			},
			tokenProperties: {
				createTime: new Date().toISOString(),
				valid: true,
				action: 'Submit',
				hostname: 'localhost',
			},
			riskAnalysis: {
				reasons: [ClassificationReason.LOW_CONFIDENCE_SCORE],
				score: 0.3,
			},
		});

		const res: request.Response = await http.post(
			'/test/submit',
			{},
			{
				headers: {
					Recaptcha: 'test_enterprise_low_score',
				},
			}
		);

		expect(res.statusCode).toBe(400);
		expect(res.body.errorCodes).toBeDefined();
		expect(res.body.errorCodes.length).toBe(1);
		expect(res.body.errorCodes[0]).toBe(ErrorCode.LowScore);
	});

	test('Enterprise Invalid reason unspecified + low score', async () => {
		mockedRecaptchaApi.addResponse<VerifyResponseEnterprise>('test_enterprise_inv_reason_unspecified_low_score', {
			name: 'name',
			event: {
				token: 'token',
				siteKey: 'siteKey',
				userAgent: '',
				userIpAddress: '',
				expectedAction: 'Submit',
				hashedAccountId: '',
			},
			riskAnalysis: {
				score: 0.6,
				reasons: [],
			},
			tokenProperties: {
				valid: true,
				invalidReason: GoogleRecaptchaEnterpriseReason.InvalidReasonUnspecified,
				hostname: 'localhost',
				action: 'Submit',
				createTime: '2022-09-07T19:53:55.566Z',
			},
		});

		const res: request.Response = await http.post(
			'/test/submit',
			{},
			{
				headers: {
					Recaptcha: 'test_enterprise_inv_reason_unspecified_low_score',
				},
			}
		);

		expect(res.statusCode).toBe(400);
		expect(res.body.errorCodes).toBeDefined();
		expect(res.body.errorCodes.length).toBe(1);
		expect(res.body.errorCodes[0]).toBe(ErrorCode.LowScore);
	});
});

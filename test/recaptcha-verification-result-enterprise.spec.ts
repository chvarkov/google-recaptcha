import { Controller, INestApplication, Post } from '@nestjs/common';
import { ClassificationReason, GoogleRecaptchaModule, Recaptcha, RecaptchaResult, RecaptchaVerificationResult } from '../src';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import * as request from 'supertest';
import { VerifyResponseEnterprise } from '../src/interfaces/verify-response-enterprise';
import { RECAPTCHA_AXIOS_INSTANCE } from '../src/provider.declarations';
import axios from 'axios';

@Controller('test')
class TestController {
	@Recaptcha()
	@Post('submit')
	testAction(@RecaptchaResult() result: RecaptchaVerificationResult): string {
		expect(result).toBeInstanceOf(RecaptchaVerificationResult);
		expect(result.success).toBeTruthy();

		expect(result.getResponse()).toBeDefined();

		const riskAnalytics = result.getEnterpriseRiskAnalytics();

		expect(riskAnalytics).toBeDefined();
		expect(riskAnalytics.score).toBe(0.5);
		expect(riskAnalytics.reasons.length).toBe(1);
		expect(riskAnalytics.reasons[0]).toBe(ClassificationReason.AUTOMATION);

		return 'OK';
	}
}

describe('Recaptcha verification result decorator (enterprise)', () => {
	let module: TestingModule;
	let app: INestApplication;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				GoogleRecaptchaModule.forRoot({
					response: (req: Request): string => req.headers.recaptcha?.toString(),
					enterprise: {
						siteKey: 'siteKey',
						apiKey: 'apiKey',
						projectId: 'projectId',
					},
				}),
			],
			controllers: [TestController],
		})
			.overrideProvider(RECAPTCHA_AXIOS_INSTANCE)
			.useFactory({
				factory: () => {
					const responseEnterprise: VerifyResponseEnterprise = {
						event: {
							expectedAction: 'Submit',
							siteKey: 'siteKey',
							token: 'token',
							hashedAccountId: 'id',
							userAgent: 'UA',
							userIpAddress: '0.0.0.0',
						},
						riskAnalysis: {
							score: 0.5,
							reasons: [ClassificationReason.AUTOMATION],
						},
						name: 'test/name',
						tokenProperties: {
							action: 'Submit',
							hostname: 'localhost',
							valid: true,
							createTime: new Date().toISOString(),
						},
					};
					return Object.assign(axios.create(), {
						post: () =>
							Promise.resolve({
								data: responseEnterprise,
							}),
					});
				},
			})
			.compile();

		app = module.createNestApplication();

		await app.init();
	});

	test('Test', () => {
		return request(app.getHttpServer()).post('/test/submit').expect(201).expect('OK');
	});
});

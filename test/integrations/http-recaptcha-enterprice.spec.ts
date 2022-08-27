import { Controller, INestApplication, LiteralObject, Post } from '@nestjs/common';
import {
    ClassificationReason,
    GoogleRecaptchaModule,
    Recaptcha,
    RecaptchaResult,
    RecaptchaVerificationResult,
} from '../../src';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { RECAPTCHA_HTTP_SERVICE } from '../../src/provider.declarations';
import * as request from 'supertest';
import { MockedRecaptchaApi } from '../utils/mocked-recaptcha-api';
import { VerifyResponseV2 } from '../../src/interfaces/verify-response';
import { TestHttp } from '../utils/test-http';
import { VerifyResponseEnterprise } from '../../src/interfaces/verify-response-enterprise';

@Controller('test')
class TestController {
    @Recaptcha({response: (req) => req.headers.recaptcha, action: 'Submit', score: 0.7})
    @Post('submit')
    testAction(@RecaptchaResult() result: RecaptchaVerificationResult): LiteralObject {
        expect(result).toBeInstanceOf(RecaptchaVerificationResult);
        expect(result.success).toBeTruthy();

        expect(result.getResponse()).toBeDefined();

        const riskAnalytics = result.getEnterpriseRiskAnalytics();

        expect(riskAnalytics).toBeDefined();

        expect(typeof riskAnalytics.score).toBe('number');
        expect(riskAnalytics.reasons).toBeInstanceOf(Array);

        return {success: true};
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
                }),
            ],
            controllers: [
                TestController,
            ],
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

    test('Enterprise OK',  async () => {
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

        const res: request.Response = await http.post('/test/submit', {}, {
            headers: {
                'Recaptcha': 'test_enterprise_ok',
            },
        });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
    });

    test('Enterprise API error', async () => {
        mockedRecaptchaApi.addError<VerifyResponseV2>('test_enterprise_api_err', {
            statusCode: 400,
        });

        const res: request.Response = await http.post('/test/submit', {}, {
            headers: {
                'Recaptcha': 'test_enterprise_api_err',
            },
        });

        expect(res.statusCode).toBe(500);
    });

    test('Enterprise Network error', async () => {
        mockedRecaptchaApi.addError<VerifyResponseV2>('test_enterprise_network_err', {
            code: 'ECONNRESET',
        });

        const res: request.Response = await http.post('/test/submit', {}, {
            headers: {
                'Recaptcha': 'test_enterprise_network_err',
            },
        });

        expect(res.statusCode).toBe(500);
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

        const res: request.Response = await http.post('/test/submit', {}, {
            headers: {
                'Recaptcha': 'test_enterprise_invalid_action',
            },
        });

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
            }
        });

        const res: request.Response = await http.post('/test/submit', {}, {
            headers: {
                'Recaptcha': 'test_enterprise_low_score',
            },
        });

        expect(res.statusCode).toBe(400);
    });
});

import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { GoogleRecaptchaValidator } from '../src/services/google-recaptcha.validator';
import { GoogleRecaptchaGuard, GoogleRecaptchaModuleOptions, GoogleRecaptchaModule } from '../src';
import { Agent } from 'https';
import { RECAPTCHA_OPTIONS } from '../src/provider.declarations';

describe('Google recaptcha module', () => {
    const customNetwork = 'CUSTOM_URL';
    let app: INestApplication;

    beforeAll(async () => {
        const testingModule = await Test.createTestingModule({
            imports: [
                GoogleRecaptchaModule.forRoot({
                    secretKey: process.env.GOOGLE_RECAPTCHA_SECRET_KEY,
                    response: req => req.headers.authorization,
                    skipIf: () => process.env.NODE_ENV !== 'production',
                    network: customNetwork,
                    agent: new Agent({maxFreeSockets: 10}),
                }),
            ],
        }).compile();

        app = testingModule.createNestApplication();
    });

    test('Test validator provider', () => {
        const guard = app.get(GoogleRecaptchaValidator);

        expect(guard).toBeInstanceOf(GoogleRecaptchaValidator);
    });

    test('Test guard provider', () => {
        const guard = app.get(GoogleRecaptchaGuard);

        expect(guard).toBeInstanceOf(GoogleRecaptchaGuard);
    });

    test('Test use recaptcha net options',  async () => {
        const options: GoogleRecaptchaModuleOptions = app.get(RECAPTCHA_OPTIONS);

        expect(options).toBeDefined();
        expect(options.network).toBe(customNetwork);
        expect(options.agent).toBeDefined();
        expect(options.agent).toBeInstanceOf(Agent);
        expect(options.agent.maxFreeSockets).toBe(10);
    });
});

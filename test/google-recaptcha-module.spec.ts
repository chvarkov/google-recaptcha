import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { GoogleRecaptchaValidator } from '../src/services/validators/google-recaptcha.validator';
import { GoogleRecaptchaGuard, GoogleRecaptchaModuleOptions, GoogleRecaptchaModule } from '../src';
import { RECAPTCHA_OPTIONS } from '../src/provider.declarations';

describe('Google recaptcha module', () => {
    const customNetwork = 'CUSTOM_URL';

    const createApp = async (options: GoogleRecaptchaModuleOptions): Promise<INestApplication> => {
        const testingModule = await Test.createTestingModule({
            imports: [
                GoogleRecaptchaModule.forRoot(options),
            ],
        }).compile();

        return testingModule.createNestApplication();
    }

    let app: INestApplication;

    beforeAll(async () => {
        app = await createApp({
            secretKey: 'secret key',
            response: req => req.headers.authorization,
            skipIf: () => process.env.NODE_ENV !== 'production',
            network: customNetwork,
        });
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
    });

    test('Test invalid config', async () => {
        await expect(createApp({response: () => ''}))
            .rejects
            .toThrowError('must be contains "secretKey" xor "enterprise"');
    })
});

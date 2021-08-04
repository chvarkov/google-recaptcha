import { Test } from '@nestjs/testing';
import { ErrorCode, GoogleRecaptchaModule } from '../src';
import { GoogleRecaptchaValidator } from '../src/services/google-recaptcha.validator';
import { GoogleRecaptchaNetworkException } from '../src/exceptions/google-recaptcha-network.exception';

describe('Google recaptcha validator', () => {

    test('Invalid secret', async () => {
        const module = await Test.createTestingModule({
            imports: [
                GoogleRecaptchaModule.forRoot({
                    response: (req) => 'TEST_TOKEN',
                    secretKey: 'TEST_SECRET',
                })
            ],
        }).compile()

        const app = module.createNestApplication();

        const validator = app.get(GoogleRecaptchaValidator);
        expect(validator).toBeDefined();
        expect(validator).toBeInstanceOf(GoogleRecaptchaValidator);

        const result = await validator.validate({response: 'TEST_TOKEN'});

        expect(result).toBeDefined();
        expect(result.success).toBeFalsy();
        expect(result.errors).toBeInstanceOf(Array);
        expect(result.errors.length).toBe(1);
        expect(result.errors[0]).toBe(ErrorCode.InvalidInputSecret);
    });

    test('Network error', async () => {
        const module = await Test.createTestingModule({
            imports: [
                GoogleRecaptchaModule.forRoot({
                    response: (req) => 'TEST_TOKEN',
                    secretKey: 'TEST_SECRET',
                    axiosConfig: {
                        proxy: {
                            port: 5555,
                            host: 'invalidhost'
                        }
                    }
                })
            ],
        }).compile()

        const app = module.createNestApplication();

        const validator = app.get(GoogleRecaptchaValidator);
        expect(validator).toBeDefined();
        expect(validator).toBeInstanceOf(GoogleRecaptchaValidator);

        await expect(validator.validate({response: 'TEST_TOKEN'})).rejects.toThrowError(GoogleRecaptchaNetworkException);
    });
});

import { GoogleRecaptchaEnterpriseValidator, GoogleRecaptchaModuleOptions, GoogleRecaptchaValidator } from '../src';
import { RecaptchaValidatorResolver } from '../src/services/recaptcha-validator.resolver';

describe('RecaptchaValidatorResolver', () => {
    const validator = new GoogleRecaptchaValidator(null, null, null);
    const enterpriseValidator = new GoogleRecaptchaEnterpriseValidator(null, null, null, null);

    const createResolver = (options: GoogleRecaptchaModuleOptions) => new RecaptchaValidatorResolver(
        options,
        validator,
        enterpriseValidator,
    );

    test('resolve', () => {
        const moduleOptions: GoogleRecaptchaModuleOptions = {
            response: (): string => 'token',
            secretKey: 'Secret',
        };

        const resolver = createResolver(moduleOptions);

        const resolvedValidator = resolver.resolve();

        expect(resolvedValidator).toBeInstanceOf(GoogleRecaptchaValidator);
    });

    test('resolve enterprise', () => {
        const moduleOptions: GoogleRecaptchaModuleOptions = {
            response: (): string => 'token',
            enterprise: {
                apiKey: 'enterprise_apiKey',
                siteKey: 'enterprise_siteKey',
                projectId: 'enterprise_projectId',
            },
        };

        const resolver = createResolver(moduleOptions);
        const resolvedValidator = resolver.resolve();

        expect(resolvedValidator).toBeInstanceOf(GoogleRecaptchaEnterpriseValidator);
    });

    test('resolve error', () => {
        const moduleOptions: GoogleRecaptchaModuleOptions = {
            response: (): string => 'token',
        };

        const resolver = createResolver(moduleOptions);
        expect(() => resolver.resolve()).toThrowError('Cannot resolve');
    });
});

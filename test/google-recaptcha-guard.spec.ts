import { ApplicationType, GoogleRecaptchaException, GoogleRecaptchaGuard } from '../src';
import { Reflector } from '@nestjs/core';
import { GoogleRecaptchaGuardOptions } from '../src/interfaces/google-recaptcha-guard-options';
import { createGoogleRecaptchaValidator } from './helpers/create-google-recaptcha-validator';
import { GoogleRecaptchaValidatorOptions } from '../src/interfaces/google-recaptcha-validator-options';
import { createExecutionContext } from './helpers/create-execution-context';
import { TestController } from './assets/test-controller';
import { TestRecaptchaNetwork } from './network/test-recaptcha-network';
import { RecaptchaRequestResolver } from '../src/services/recaptcha-request.resolver';

describe('Google recaptcha guard', () => {
    let network: TestRecaptchaNetwork;
    const networkPort = 6048;
    const validatorOptions: GoogleRecaptchaValidatorOptions = {
        secretKey: 'Secret',
    };
    const guardOptions: GoogleRecaptchaGuardOptions = {
        response: req => req.body.recaptcha,
    };
    const controller = new TestController();


    beforeAll(async () => {
        network = await TestRecaptchaNetwork.create(networkPort);
    });

    afterAll(async () => {
        await network.close();
    });

    test('SkipIf = true + default response provider', async () => {
        const validator = createGoogleRecaptchaValidator(validatorOptions);
        const guard = new GoogleRecaptchaGuard(validator, new Reflector(), new RecaptchaRequestResolver(), {
            ...guardOptions,
            skipIf: true,
        });

        const context = createExecutionContext(controller.submit, {body: {recaptcha: 'RECAPTCHA_TOKEN'}});

        const canActivate = await guard.canActivate(context);

        expect(canActivate).toBeTruthy();
    });

    test('SkipIf = (req) => true + overridden response provider', async () => {
        const validator = createGoogleRecaptchaValidator(validatorOptions);
        const guard = new GoogleRecaptchaGuard(validator, new Reflector(), new RecaptchaRequestResolver(), {
            ...guardOptions,
            skipIf: req => true,
        });

        const context = createExecutionContext(controller.submitOverridden.prototype, {body: {recaptcha: 'RECAPTCHA_TOKEN'}});

        const canActivate = await guard.canActivate(context);

        expect(canActivate).toBeTruthy();
    });

    test('Invalid secret', async () => {
        const validator = createGoogleRecaptchaValidator(validatorOptions);
        const guard = new GoogleRecaptchaGuard(validator, new Reflector(), new RecaptchaRequestResolver(), guardOptions);

        const context = createExecutionContext(controller.submit, {body: {recaptcha: 'RECAPTCHA_TOKEN'}});

        await guard.canActivate(context)
            .then(() => expect(true).toBeFalsy())
            .catch(e => expect(e).toBeInstanceOf(GoogleRecaptchaException))
    });

    test('Invalid network', async () => {
        const validator = createGoogleRecaptchaValidator({
            ...validatorOptions,
            network: 'https://localhost/some-invalid-path',
        });
        const guard = new GoogleRecaptchaGuard(validator, new Reflector(), new RecaptchaRequestResolver(), guardOptions);

        const context = createExecutionContext(controller.submit, {body: {recaptcha: 'RECAPTCHA_TOKEN'}});

        await guard.canActivate(context)
            .then(() => expect(true).toBeFalsy())
            .catch(e => expect(e).toBeInstanceOf(GoogleRecaptchaException))
    });

    test('Valid', async () => {
        network.setResult({
            success: true,
        })
        const validator = createGoogleRecaptchaValidator({
            ...validatorOptions,
            network: network.url,
        });
        const guard = new GoogleRecaptchaGuard(validator, new Reflector(), new RecaptchaRequestResolver(), guardOptions);

        const context = createExecutionContext(controller.submit, {body: {recaptcha: 'RECAPTCHA_TOKEN'}});

        const canActivate = await guard.canActivate(context);

        expect(canActivate).toBeTruthy();
    });

    test('Valid + AppType', async () => {
        network.setResult({
            success: true,
        })
        const validator = createGoogleRecaptchaValidator({
            ...validatorOptions,
            network: network.url,
        });
        const guard = new GoogleRecaptchaGuard(validator, new Reflector(), new RecaptchaRequestResolver(), {
            ...guardOptions,
            applicationType: ApplicationType.Rest,
        });

        const context = createExecutionContext(controller.submit, {body: {recaptcha: 'RECAPTCHA_TOKEN'}});

        const canActivate = await guard.canActivate(context);

        expect(canActivate).toBeTruthy();
    });
});

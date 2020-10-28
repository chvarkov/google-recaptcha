import { Test } from '@nestjs/testing';
import { Module } from '@nestjs/common';
import { GoogleRecaptchaValidator } from '../src/services/google-recaptcha.validator';
import { GoogleRecaptchaModule } from '../src/google-recaptcha.module';
import { GoogleRecaptchaModuleOptions } from '../src';
import { GoogleRecaptchaOptionsFactory } from '../src/interfaces/google-recaptcha-module-options';

export class GoogleRecaptchaModuleOptionsFactory implements GoogleRecaptchaOptionsFactory {
    createGoogleRecaptchaOptions(): Promise<GoogleRecaptchaModuleOptions> {
        return Promise.resolve(new TestConfigService().getGoogleRecaptchaOptions());
    }
}

export class TestConfigService {
    getGoogleRecaptchaOptions(): GoogleRecaptchaModuleOptions {
        return {
            secretKey: 'secret',
            response: req => req.body.recaptcha,
            skipIf: () => true,
        };
    }
}

@Module({
    providers: [
        TestConfigService,
        GoogleRecaptchaModuleOptionsFactory,
    ],
    exports: [
        TestConfigService,
        GoogleRecaptchaModuleOptionsFactory,
    ],
})
export class TestConfigModule {

}

describe('Google recaptcha async module', () => {
    test('Test via import module',  async () => {
        const testingModule = await Test.createTestingModule({
            imports: [
                GoogleRecaptchaModule.forRootAsync({
                    imports: [TestConfigModule],
                    useFactory: (config: TestConfigService) => config.getGoogleRecaptchaOptions(),
                    inject: [
                        TestConfigService,
                    ],
                }),
            ],
        }).compile();

        const app = testingModule.createNestApplication();

        const validator = app.get(GoogleRecaptchaValidator);
        expect(validator).toBeInstanceOf(GoogleRecaptchaValidator);
    });

    test('Test via useClass',  async () => {
        const testingModule = await Test.createTestingModule({
            imports: [
                GoogleRecaptchaModule.forRootAsync({
                    useClass: GoogleRecaptchaModuleOptionsFactory,
                }),
            ],
        }).compile();

        const app = testingModule.createNestApplication();

        const validator = app.get(GoogleRecaptchaValidator);
        expect(validator).toBeInstanceOf(GoogleRecaptchaValidator);
    });

    test('Test via useExisting',  async () => {
        const testingModule = await Test.createTestingModule({
            imports: [
                GoogleRecaptchaModule.forRootAsync({
                    imports: [
                        TestConfigModule,
                    ],
                    useExisting: GoogleRecaptchaModuleOptionsFactory,
                }),
            ],
        }).compile();

        const app = testingModule.createNestApplication();

        const validator = app.get(GoogleRecaptchaValidator);
        expect(validator).toBeInstanceOf(GoogleRecaptchaValidator);
    });

    test('Test via useClass that not implement GoogleRecaptchaOptionsFactory',  async () => {
        await Test.createTestingModule({
            imports: [
                GoogleRecaptchaModule.forRootAsync({
                    useClass: TestConfigModule as any,
                }),
            ],
        }).compile()
            .then(() => expect(true).toBeFalsy())
            .catch(e => expect(e.message).toBe('Factory must be implement \'GoogleRecaptchaOptionsFactory\' interface.'));
    });
});

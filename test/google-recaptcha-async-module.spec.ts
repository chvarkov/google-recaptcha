import { Test } from '@nestjs/testing';
import { GoogleRecaptchaValidator } from '../src/services/google-recaptcha.validator';
import { GoogleRecaptchaModule } from '../src';
import { TestConfigModule } from './assets/test-config-module';
import { TestConfigService } from './assets/test-config-service';
import { GoogleRecaptchaModuleOptionsFactory } from './assets/test-recaptcha-options-factory';

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

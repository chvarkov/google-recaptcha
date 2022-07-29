import { Test } from '@nestjs/testing';
import { GoogleRecaptchaValidator } from '../src/services/google-recaptcha.validator';
import { GoogleRecaptchaModule, GoogleRecaptchaModuleOptions } from '../src';
import { TestConfigModule } from './assets/test-config-module';
import { TestConfigService } from './assets/test-config-service';
import { GoogleRecaptchaModuleOptionsFactory } from './assets/test-recaptcha-options-factory';
import { HttpModule, HttpService } from '@nestjs/axios';
import { RECAPTCHA_AXIOS_INSTANCE, RECAPTCHA_HTTP_SERVICE, RECAPTCHA_OPTIONS } from '../src/provider.declarations';
import { AxiosInstance, AxiosProxyConfig, AxiosRequestConfig } from 'axios';
import * as https from 'https';

describe('Google recaptcha async module', () => {
    const checkDefaultConfigs = (defaults: AxiosRequestConfig) => {
        expect(defaults).toBeDefined();
        expect(defaults.proxy).toBeDefined();

        const proxy: AxiosProxyConfig = defaults.proxy as AxiosProxyConfig;

        expect(proxy).toBeDefined();
        expect(typeof proxy).toBe('object');
        expect(proxy.host).toBe('TEST_PROXY_HOST');
        expect(proxy.port).toBe(7777);
    };

    test('Test via import module and use default axios config',  async () => {
        const testingModule = await Test.createTestingModule({
            imports: [
                GoogleRecaptchaModule.forRootAsync({
                    imports: [
                        HttpModule.register({
                            proxy: {
                                host: 'TEST_PROXY_HOST',
                                port: 7777,
                            },
                            data: 'TEST',
                            timeout: 1000000000,
                            httpsAgent: new https.Agent({
                                timeout: 17_000,
                            }),
                        }),
                        TestConfigModule,
                    ],
                    useFactory: (config: TestConfigService, http: HttpService) => ({
                        ...config.getGoogleRecaptchaOptions(),
                        axiosConfig: {...http.axiosRef.defaults, headers: {}},
                    }),
                    inject: [
                        TestConfigService,
                        HttpService,
                    ],
                }),
            ],
        }).compile();

        const app = testingModule.createNestApplication();

        await app.init();

        const validator = app.get(GoogleRecaptchaValidator);
        expect(validator).toBeInstanceOf(GoogleRecaptchaValidator);

        const axiosInstance: AxiosInstance = app.get(RECAPTCHA_AXIOS_INSTANCE);

        checkDefaultConfigs({...axiosInstance.defaults, headers: {}});

        expect(axiosInstance.defaults.data).toBeUndefined();

        const options: GoogleRecaptchaModuleOptions = app.get(RECAPTCHA_OPTIONS);

        expect(options).toBeDefined();

        checkDefaultConfigs(options.axiosConfig);

        expect(options.axiosConfig.data).toBe('TEST');

        const httpService: HttpService = app.get(RECAPTCHA_HTTP_SERVICE);

        const httpsAgent: https.Agent = httpService.axiosRef.defaults.httpsAgent;

        expect(httpsAgent).toBeInstanceOf(https.Agent);
        expect(httpsAgent.options.timeout).toBe(17_000);
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

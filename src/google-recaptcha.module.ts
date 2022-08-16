import { DynamicModule, LiteralObject, Logger, Provider } from '@nestjs/common';
import { GoogleRecaptchaGuard } from './guards/google-recaptcha.guard';
import { GoogleRecaptchaValidator } from './services/validators/google-recaptcha.validator';
import { GoogleRecaptchaEnterpriseValidator } from './services/validators/google-recaptcha-enterprise.validator';
import {
    GoogleRecaptchaModuleAsyncOptions,
    GoogleRecaptchaModuleOptions, GoogleRecaptchaOptionsFactory,
} from './interfaces/google-recaptcha-module-options';
import {
    RECAPTCHA_AXIOS_INSTANCE,
    RECAPTCHA_HTTP_SERVICE,
    RECAPTCHA_LOGGER,
    RECAPTCHA_OPTIONS,
} from './provider.declarations';
import { RecaptchaRequestResolver } from './services/recaptcha-request.resolver';
import { loadModule } from './helpers/load-module';
import { Reflector } from '@nestjs/core';
import * as axios from 'axios';
import { Agent } from 'https';
import { RecaptchaValidatorResolver } from './services/recaptcha-validator.resolver';
import { EnterpriseReasonTransformer } from './services/enterprise-reason.transformer';
import { xor } from './helpers/xor';

export class GoogleRecaptchaModule {
    private static axiosDefaultConfig: axios.AxiosRequestConfig = {
        timeout: 60_000,
        httpsAgent: new Agent({keepAlive: true}),
    };

    static forRoot(options: GoogleRecaptchaModuleOptions): DynamicModule {
        const providers: Provider[] = [
            Reflector,
            GoogleRecaptchaGuard,
            GoogleRecaptchaValidator,
            GoogleRecaptchaEnterpriseValidator,
            RecaptchaRequestResolver,
            RecaptchaValidatorResolver,
            EnterpriseReasonTransformer,
            {
                provide: RECAPTCHA_OPTIONS,
                useValue: options,
            },
            {
                provide: RECAPTCHA_LOGGER,
                useFactory: () => options.logger || new Logger(),
            },
        ];

        this.validateOptions(options);

        const httpModule = this.resolveHttpModule();

        const internalProviders: Provider[] = [
            {
                provide: RECAPTCHA_HTTP_SERVICE,
                useFactory: (axiosInstance: axios.AxiosInstance) => new httpModule.HttpService(axiosInstance),
                inject: [
                    RECAPTCHA_AXIOS_INSTANCE,
                ],
            },
            {
                provide: RECAPTCHA_AXIOS_INSTANCE,
                useFactory: () => axios.default.create(this.transformAxiosConfig({
                    ...this.axiosDefaultConfig,
                    ...options.axiosConfig,
                    headers: null,
                })),
            },
        ];

        return {
            global: true,
            module: GoogleRecaptchaModule,
            imports: [
                httpModule.HttpModule,
            ],
            providers: providers.concat(internalProviders),
            exports: providers,
        };
    }

    static forRootAsync(options: GoogleRecaptchaModuleAsyncOptions): DynamicModule {
        const providers: Provider[] = [
            Reflector,
            {
                provide: RECAPTCHA_LOGGER,
                useFactory: (options: GoogleRecaptchaModuleOptions) => options.logger || new Logger(),
                inject: [
                    RECAPTCHA_OPTIONS,
                ],
            },
            GoogleRecaptchaGuard,
            GoogleRecaptchaValidator,
            GoogleRecaptchaEnterpriseValidator,
            RecaptchaRequestResolver,
            RecaptchaValidatorResolver,
            EnterpriseReasonTransformer,
            ...this.createAsyncProviders(options),
        ];

        const httpModule = this.resolveHttpModule();

        const internalProviders: Provider[] = [
            {
                provide: RECAPTCHA_HTTP_SERVICE,
                useFactory: (axiosInstance: axios.AxiosInstance) => new httpModule.HttpService(axiosInstance),
                inject: [
                    RECAPTCHA_AXIOS_INSTANCE,
                ],
            },
            {
                provide: RECAPTCHA_AXIOS_INSTANCE,
                useFactory: (options: GoogleRecaptchaModuleOptions): axios.AxiosInstance => {
                    this.validateOptions(options);

                    const transformedAxiosConfig = this.transformAxiosConfig({
                        ...this.axiosDefaultConfig,
                        ...options.axiosConfig,
                        headers: null,
                    });
                    return axios.default.create(transformedAxiosConfig);
                },
                inject: [
                    RECAPTCHA_OPTIONS,
                ],
            },
        ];

        return {
            global: true,
            module: GoogleRecaptchaModule,
            imports: [
                ...options.imports || [],
                httpModule.HttpModule,
            ],
            providers: providers.concat(internalProviders),
            exports: providers,
        };
    }

    private static resolveHttpModule(): LiteralObject {
        try {
            return loadModule('@nestjs/axios');
        } catch (e) {
            return loadModule('@nestjs/common');
        }
    }

    private static transformAxiosConfig(axiosConfig?: axios.AxiosRequestConfig): axios.AxiosRequestConfig {
        if (!axiosConfig) {
            return {};
        }

        const config = {...axiosConfig};

        delete config.baseURL;
        delete config.url;
        delete config.responseType;
        delete config.method;
        delete config.transformRequest;
        delete config.transformResponse;
        delete config.paramsSerializer;
        delete config.validateStatus;
        delete config.data;
        delete config.adapter;

        return config;
    }

    private static createAsyncProviders(options: GoogleRecaptchaModuleAsyncOptions): Provider[] {
        const providers: Provider[] = [this.createAsyncOptionsProvider(options)];

        if (options.useClass) {
            providers.push({
                provide: options.useClass,
                useClass: options.useClass,
            });
        }

        return providers;
    }

    private static createAsyncOptionsProvider(options: GoogleRecaptchaModuleAsyncOptions): Provider {
        if (options.useFactory) {
            return {
                provide: RECAPTCHA_OPTIONS,
                useFactory: options.useFactory,
                inject: options.inject || [],
            };
        }

        return {
            provide: RECAPTCHA_OPTIONS,
            useFactory: async (optionsFactory: GoogleRecaptchaOptionsFactory): Promise<GoogleRecaptchaModuleOptions> => {
                if (!this.isGoogleRecaptchaFactory(optionsFactory)) {
                    throw new Error('Factory must be implement \'GoogleRecaptchaOptionsFactory\' interface.');
                }
                return optionsFactory.createGoogleRecaptchaOptions();
            },
            inject: [options.useExisting || options.useClass],
        };
    }

    private static validateOptions(options: GoogleRecaptchaModuleOptions): void | never {
        const hasEnterpriseOptions = !!Object.keys(options.enterprise || {}).length;
        if (!xor(!!options.secretKey, hasEnterpriseOptions)) {
            throw new Error('Google recaptcha options must be contains "secretKey" xor "enterprise".');
        }
    }

    private static isGoogleRecaptchaFactory(object?: GoogleRecaptchaOptionsFactory): object is GoogleRecaptchaOptionsFactory {
        return !!object && typeof object.createGoogleRecaptchaOptions === 'function';
    }
}

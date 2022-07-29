import { DynamicModule, Provider } from '@nestjs/common';
import { GoogleRecaptchaGuard } from './guards/google-recaptcha.guard';
import { GoogleRecaptchaValidator } from './services/google-recaptcha.validator';
import {
    GoogleRecaptchaModuleAsyncOptions,
    GoogleRecaptchaModuleOptions, GoogleRecaptchaOptionsFactory
} from './interfaces/google-recaptcha-module-options';
import { RECAPTCHA_AXIOS_INSTANCE, RECAPTCHA_HTTP_SERVICE, RECAPTCHA_OPTIONS } from './provider.declarations';
import { RecaptchaRequestResolver } from './services/recaptcha-request.resolver';
import { loadModule } from './helpers/load-module';
import { Reflector } from '@nestjs/core';
import * as axios from 'axios';
import { Agent } from 'https';

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
            RecaptchaRequestResolver,
            {
                provide: RECAPTCHA_OPTIONS,
                useValue: options,
            },
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
                useFactory: () => axios.default.create(this.transformAxiosConfig(options.axiosConfig)),
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
            GoogleRecaptchaGuard,
            GoogleRecaptchaValidator,
            RecaptchaRequestResolver,
            ...this.createAsyncProviders(options)
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
                useFactory: (options: GoogleRecaptchaModuleOptions) => {
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

    private static resolveHttpModule(): any {
        try {
            return loadModule('@nestjs/axios');
        } catch (e) {
            return loadModule('@nestjs/common');
        }
    }

    private static transformAxiosConfig(axiosConfig?: axios.AxiosRequestConfig): axios.AxiosRequestConfig {
        const {
            baseURL,
            url,
            responseType,
            method,
            transformRequest,
            transformResponse,
            paramsSerializer,
            validateStatus,
            data,
            adapter,
            ...config
        } = axiosConfig || {};

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
            useFactory: (optionsFactory: GoogleRecaptchaOptionsFactory) => {
                if (!this.isGoogleRecaptchaFactory(optionsFactory)) {
                    throw new Error('Factory must be implement \'GoogleRecaptchaOptionsFactory\' interface.')
                }
                return optionsFactory.createGoogleRecaptchaOptions();
            },
            inject: [options.useExisting! || options.useClass!],
        };
    }

    private static isGoogleRecaptchaFactory(object: any): object is GoogleRecaptchaOptionsFactory {
        return !!object && typeof object.createGoogleRecaptchaOptions === 'function';
    }
}

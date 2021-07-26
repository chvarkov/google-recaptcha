import { DynamicModule, Module, Provider } from '@nestjs/common';
import { GoogleRecaptchaGuard } from './guards/google-recaptcha.guard';
import { GoogleRecaptchaValidator } from './services/google-recaptcha.validator';
import {
    GoogleRecaptchaModuleAsyncOptions,
    GoogleRecaptchaModuleOptions, GoogleRecaptchaOptionsFactory
} from './interfaces/google-recaptcha-module-options';
import { RECAPTCHA_HTTP_SERVICE, RECAPTCHA_OPTIONS } from './provider.declarations';
import { RecaptchaRequestResolver } from './services/recaptcha-request.resolver';
import { loadModule } from './helpers/load-module';
import { Reflector } from '@nestjs/core';

@Module({})
export class GoogleRecaptchaModule {
    static forRoot(options: GoogleRecaptchaModuleOptions): DynamicModule {
        const providers: Provider[] = [
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
            Reflector,
            {
                provide: RECAPTCHA_HTTP_SERVICE,
                useExisting: httpModule.HttpService,
            }
        ];

        return {
            global: true,
            module: GoogleRecaptchaModule,
            imports: [
                httpModule.HttpModule,
            ],
            providers: providers.concat(internalProviders),
            exports: providers,
        }
    }

    static forRootAsync(options: GoogleRecaptchaModuleAsyncOptions): DynamicModule {
        const providers: Provider[] = [
            GoogleRecaptchaGuard,
            GoogleRecaptchaValidator,
            RecaptchaRequestResolver,
            ...this.createAsyncProviders(options)
        ];

        const httpModule = this.resolveHttpModule();

        const internalProviders: Provider[] = [
            Reflector,
            {
                provide: RECAPTCHA_HTTP_SERVICE,
                useExisting: httpModule.HttpService,
            }
        ];

        return {
	        global: true,
            module: GoogleRecaptchaModule,
            imports: [
                httpModule.HttpModule,
                ...options.imports || []
            ],
            providers: providers.concat(internalProviders),
            exports: providers,
        }
    }

    private static resolveHttpModule(): any {
        try {
            return loadModule('@nestjs/axios');
        } catch (e) {
            return loadModule('@nestjs/common');
        }
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

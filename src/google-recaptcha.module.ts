import { DynamicModule, HttpModule, Module, Provider } from '@nestjs/common';
import { GoogleRecaptchaGuard } from './guards/google-recaptcha.guard';
import { GoogleRecaptchaValidator } from './services/google-recaptcha.validator';
import {
    GoogleRecaptchaModuleAsyncOptions,
    GoogleRecaptchaModuleOptions, GoogleRecaptchaOptionsFactory
} from './interfaces/google-recaptcha-module-options';
import { RECAPTCHA_OPTIONS } from './provider.declarations';

@Module({})
export class GoogleRecaptchaModule {
    static forRoot(options: GoogleRecaptchaModuleOptions): DynamicModule {
        const providers: Provider[] = [
            GoogleRecaptchaGuard,
            GoogleRecaptchaValidator,
            {
                provide: RECAPTCHA_OPTIONS,
                useValue: options,
            },
        ];

        return {
            global: true,
            module: GoogleRecaptchaModule,
            imports: [
                HttpModule
            ],
            providers: providers,
            exports: providers,
        }
    }

    static forRootAsync(options: GoogleRecaptchaModuleAsyncOptions): DynamicModule {
        const providers: Provider[] = [
            GoogleRecaptchaGuard,
            GoogleRecaptchaValidator,
            ...this.createAsyncProviders(options)
        ];

        return {
	        global: true,
            module: GoogleRecaptchaModule,
            imports: [
                HttpModule,
                ...options.imports || []
            ],
            providers: providers,
            exports: providers,
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

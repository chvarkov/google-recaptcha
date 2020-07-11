import { DynamicModule, HttpModule, Module, Provider } from '@nestjs/common';
import { GoogleRecaptchaGuard } from './guards/google-recaptcha.guard';
import { GoogleRecaptchaValidator } from './services/google-recaptcha.validator';
import { GoogleRecaptchaModuleOptions } from './interfaces/google-recaptcha-module-options';
import { RECAPTCHA_OPTIONS } from './provider.declarations';

@Module({
})
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
            module: GoogleRecaptchaModule,
            imports: [
                HttpModule,
            ],
            providers,
            exports: providers,
        }
    }
}

import { DynamicModule, HttpModule, HttpService, Module, Provider } from '@nestjs/common';
import { GoogleRecaptchaGuard } from './guards/google-recaptcha.guard';
import { GoogleRecaptchaValidator } from './services/google-recaptcha.validator';
import { GoogleRecaptchaModuleOptions } from './interfaces/google-recaptcha-module-options';

@Module({
})
export class GoogleRecaptchaModule {
    static forRoot(options: GoogleRecaptchaModuleOptions): DynamicModule {
        const providers: Provider[] = [
            {
                provide: GoogleRecaptchaGuard,
                useFactory: (validator: GoogleRecaptchaValidator) => new GoogleRecaptchaGuard(validator, options),
                inject: [
                    GoogleRecaptchaValidator,
                ]
            },
            {
                provide: GoogleRecaptchaValidator,
                useFactory: (http: HttpService) => new GoogleRecaptchaValidator(http, options),
                inject: [
                    HttpService,
                ],
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

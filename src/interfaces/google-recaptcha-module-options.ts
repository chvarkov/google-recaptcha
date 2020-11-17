import { GoogleRecaptchaGuardOptions } from './google-recaptcha-guard-options';
import { GoogleRecaptchaValidatorOptions } from './google-recaptcha-validator-options';
import { ModuleMetadata, Type } from '@nestjs/common/interfaces';

export interface GoogleRecaptchaModuleOptions extends GoogleRecaptchaValidatorOptions, GoogleRecaptchaGuardOptions {}

export interface GoogleRecaptchaOptionsFactory {
    createGoogleRecaptchaOptions(): Promise<GoogleRecaptchaModuleOptions> | GoogleRecaptchaModuleOptions;
}

export interface GoogleRecaptchaModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
    inject?: any[];
    useClass?: Type<GoogleRecaptchaOptionsFactory>;
    useExisting?: Type<GoogleRecaptchaOptionsFactory>;
    useFactory?: (...args: any[]) => Promise<GoogleRecaptchaModuleOptions> | GoogleRecaptchaModuleOptions;
}

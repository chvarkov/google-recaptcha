import { GoogleRecaptchaGuardOptions } from './google-recaptcha-guard-options';
import { GoogleRecaptchaValidatorOptions } from './google-recaptcha-validator-options';
import { FactoryProvider, ModuleMetadata, Type, Logger } from '@nestjs/common';

export interface GoogleRecaptchaModuleOptions extends GoogleRecaptchaValidatorOptions, GoogleRecaptchaGuardOptions {
	debug?: boolean;
	logger?: Logger;
	global?: boolean;
}

export interface GoogleRecaptchaOptionsFactory {
	createGoogleRecaptchaOptions(): Promise<GoogleRecaptchaModuleOptions> | GoogleRecaptchaModuleOptions;
}

export interface GoogleRecaptchaModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
	/** Same tokens as Nest's `FactoryProvider.inject`. */
	inject?: FactoryProvider['inject'];
	useClass?: Type<GoogleRecaptchaOptionsFactory>;
	useExisting?: Type<GoogleRecaptchaOptionsFactory>;
	// `never[]` accepts a factory with any parameters, e.g. `(config: ConfigService) => ...`.
	useFactory?: (...args: never[]) => Promise<Omit<GoogleRecaptchaModuleOptions, 'global'>> | Omit<GoogleRecaptchaModuleOptions, 'global'>;
	global?: boolean;
}

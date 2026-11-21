import { GoogleRecaptchaGuardOptions } from './google-recaptcha-guard-options';
import { GoogleRecaptchaValidatorOptions } from './google-recaptcha-validator-options';
import { ModuleMetadata, Type, Logger, Abstract } from '@nestjs/common';

export interface GoogleRecaptchaModuleOptions extends GoogleRecaptchaValidatorOptions, GoogleRecaptchaGuardOptions {
	debug?: boolean;
	logger?: Logger;
	global?: boolean;
}

export interface GoogleRecaptchaOptionsFactory {
	createGoogleRecaptchaOptions(): Promise<GoogleRecaptchaModuleOptions> | GoogleRecaptchaModuleOptions;
}

export interface GoogleRecaptchaModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
	// eslint-disable-next-line
	inject?: Array<string | symbol | Type | Abstract<any> | Function>;
	useClass?: Type<GoogleRecaptchaOptionsFactory>;
	useExisting?: Type<GoogleRecaptchaOptionsFactory>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	useFactory?: (...args: any[]) => Promise<Omit<GoogleRecaptchaModuleOptions, 'global'>> | Omit<GoogleRecaptchaModuleOptions, 'global'>;
	global?: boolean;
}

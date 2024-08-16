import { GoogleRecaptchaGuardOptions } from './google-recaptcha-guard-options';
import { GoogleRecaptchaValidatorOptions } from './google-recaptcha-validator-options';
import { ModuleMetadata, Type } from '@nestjs/common/interfaces';
import { Logger } from '@nestjs/common';
import { Abstract } from '@nestjs/common/interfaces/abstract.interface';

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

import { GoogleRecaptchaGuardOptions } from './google-recaptcha-guard-options';
import {
	GoogleRecaptchaEnterpriseValidatorOptions,
	GoogleRecaptchaV2ValidatorOptions,
	GoogleRecaptchaV3ValidatorOptions,
} from './google-recaptcha-validator-options';
import { FactoryProvider, ModuleMetadata, Type, Logger } from '@nestjs/common';

/** Module options shared by all reCAPTCHA types. */
export interface GoogleRecaptchaCommonModuleOptions extends GoogleRecaptchaGuardOptions {
	debug?: boolean;
	logger?: Logger;
	global?: boolean;
}

export interface GoogleRecaptchaV2ModuleOptions extends GoogleRecaptchaV2ValidatorOptions, GoogleRecaptchaCommonModuleOptions {}

export interface GoogleRecaptchaV3ModuleOptions extends GoogleRecaptchaV3ValidatorOptions, GoogleRecaptchaCommonModuleOptions {}

export interface GoogleRecaptchaEnterpriseModuleOptions
	extends GoogleRecaptchaEnterpriseValidatorOptions, GoogleRecaptchaCommonModuleOptions {}

/**
 * - `type: 'v2'` with `secretKey` (no `score` / `actions`);
 * - `type: 'v3'` (or no `type`) with `secretKey`;
 * - `type: 'enterprise'` (or no `type`) with `enterprise`.
 */
export type GoogleRecaptchaModuleOptions =
	GoogleRecaptchaV2ModuleOptions | GoogleRecaptchaV3ModuleOptions | GoogleRecaptchaEnterpriseModuleOptions;

/** `Omit` that keeps the union: built-in `Omit` would drop variant-specific fields (`type`, `secretKey`, `enterprise`, ...). */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export interface GoogleRecaptchaOptionsFactory {
	createGoogleRecaptchaOptions(): Promise<GoogleRecaptchaModuleOptions> | GoogleRecaptchaModuleOptions;
}

export interface GoogleRecaptchaModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
	/** Same tokens as Nest's `FactoryProvider.inject`. */
	inject?: FactoryProvider['inject'];
	useClass?: Type<GoogleRecaptchaOptionsFactory>;
	useExisting?: Type<GoogleRecaptchaOptionsFactory>;
	// `never[]` accepts a factory with any parameters, e.g. `(config: ConfigService) => ...`.
	useFactory?: (
		...args: never[]
	) => Promise<DistributiveOmit<GoogleRecaptchaModuleOptions, 'global'>> | DistributiveOmit<GoogleRecaptchaModuleOptions, 'global'>;
	global?: boolean;
}

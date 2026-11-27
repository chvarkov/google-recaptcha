import { GoogleRecaptchaGuardOptions } from './google-recaptcha-guard-options.js';
import {
	GoogleRecaptchaCommonValidatorOptions,
	GoogleRecaptchaEnterpriseValidatorOptions,
	GoogleRecaptchaV2ValidatorOptions,
	GoogleRecaptchaV3ValidatorOptions,
} from './google-recaptcha-validator-options.js';
import { FactoryProvider, ModuleMetadata, Type, Logger } from '@nestjs/common';
import { DistributiveOmit } from '../types.js';

/**
 * `score` / `action` checks requested by `@Recaptcha(...)` / `@SetRecaptchaOptions(...)` for reCAPTCHA v2 (its response has neither):
 * `'reject'` - `GoogleRecaptchaException` (`unsupported-check`), `'ignore'` - the checks are skipped (logged in `debug` mode).
 */
export type GoogleRecaptchaUnsupportedChecks = 'reject' | 'ignore';

/** Module options shared by all reCAPTCHA types. */
export interface GoogleRecaptchaCommonModuleOptions extends GoogleRecaptchaGuardOptions {
	/**
	 * Decorator `score` / `action` checks for reCAPTCHA v2. Default: `'reject'`.
	 * Use `'ignore'` when the type is switched at runtime (`RecaptchaConfigRef.setOptions()`) and routes have checks for v3.
	 * Not changed by `setOptions()` / `clear()`.
	 */
	unsupportedChecks?: GoogleRecaptchaUnsupportedChecks;
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
 * - `type: 'v3'` with `secretKey`;
 * - `type: 'enterprise'` with `enterprise`.
 */
export type GoogleRecaptchaModuleOptions =
	GoogleRecaptchaV2ModuleOptions | GoogleRecaptchaV3ModuleOptions | GoogleRecaptchaEnterpriseModuleOptions;

/** Guard behaviour while reCAPTCHA keys are not set: `'reject'` - `GoogleRecaptchaException` (`not-configured`), `'skip'` - pass. */
export type GoogleRecaptchaWhenNotConfigured = 'reject' | 'skip';

/**
 * Options of `forRootDeferred()`: keys are not known at startup (e.g. set by an administrator)
 * and are set later via `RecaptchaConfigRef.setOptions()`.
 */
export interface GoogleRecaptchaDeferredModuleOptions extends GoogleRecaptchaCommonValidatorOptions, GoogleRecaptchaCommonModuleOptions {
	/** Guard behaviour until `RecaptchaConfigRef.setOptions()` is called (or after `clear()`). Default: `'reject'`. */
	whenNotConfigured?: GoogleRecaptchaWhenNotConfigured;
	type?: never;
	secretKey?: never;
	siteVerifyUrl?: never;
	enterprise?: never;
	score?: never;
	actions?: never;
}

/** Current config held by `RecaptchaConfigRef`: `type` is `undefined` while keys are not set (`forRootDeferred()`, `clear()`). */
export type GoogleRecaptchaConfig =
	GoogleRecaptchaModuleOptions | DistributiveOmit<GoogleRecaptchaDeferredModuleOptions, 'whenNotConfigured'>;

export interface GoogleRecaptchaOptionsFactory<T = GoogleRecaptchaModuleOptions> {
	createGoogleRecaptchaOptions(): Promise<T> | T;
}

/** `T` is `GoogleRecaptchaModuleOptions` for `forRootAsync()` and `GoogleRecaptchaDeferredModuleOptions` for `forRootDeferredAsync()`. */
export interface GoogleRecaptchaModuleAsyncOptions<T = GoogleRecaptchaModuleOptions> extends Pick<ModuleMetadata, 'imports'> {
	/** Same tokens as Nest's `FactoryProvider.inject`. */
	inject?: FactoryProvider['inject'];
	useClass?: Type<GoogleRecaptchaOptionsFactory<T>>;
	useExisting?: Type<GoogleRecaptchaOptionsFactory<T>>;
	// `never[]` accepts a factory with any parameters, e.g. `(config: ConfigService) => ...`.
	useFactory?: (...args: never[]) => Promise<DistributiveOmit<T, 'global'>> | DistributiveOmit<T, 'global'>;
	global?: boolean;
}

export type GoogleRecaptchaDeferredModuleAsyncOptions = GoogleRecaptchaModuleAsyncOptions<GoogleRecaptchaDeferredModuleOptions>;

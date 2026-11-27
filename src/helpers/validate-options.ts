import { xor } from './xor.js';
import { GoogleRecaptchaCommonModuleOptions, GoogleRecaptchaDeferredModuleOptions } from '../interfaces/google-recaptcha-module-options.js';
import {
	GoogleRecaptchaRuntimeOptions,
	GoogleRecaptchaType,
	GoogleRecaptchaValidatorOptions,
} from '../interfaces/google-recaptcha-validator-options.js';
import { GoogleRecaptchaEnterpriseOptions } from '../interfaces/google-recaptcha-enterprise-options.js';

/** Options replaced by `RecaptchaConfigRef.setOptions()` / reset by `clear()`; not accepted by `forRootDeferred()`. */
export const RUNTIME_OPTION_KEYS = [
	'type',
	'secretKey',
	'siteVerifyUrl',
	'enterprise',
	'score',
	'actions',
] as const satisfies readonly (keyof GoogleRecaptchaRuntimeOptions)[];

const ENTERPRISE_REQUIRED_KEYS = ['projectId', 'siteKey', 'apiKey'] as const satisfies readonly (keyof GoogleRecaptchaEnterpriseOptions)[];

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.length > 0;

const RECAPTCHA_TYPES: readonly string[] = ['v2', 'v3', 'enterprise'] satisfies GoogleRecaptchaType[];

/**
 * Validates the type-dependent options (`type`, `secretKey`, `enterprise`, `score`, `actions`).
 * Types already guarantee these checks; they are for JS users and untyped configs (e.g. loaded from a database).
 */
export function validateOptions(options: Partial<GoogleRecaptchaValidatorOptions>): void | never {
	// Presence, not validity: empty values are reported below with a precise message.
	const hasEnterpriseOptions = options.enterprise != null;
	if (!xor(options.secretKey != null, hasEnterpriseOptions)) {
		throw new Error('Google reCAPTCHA options must contain either "secretKey" or "enterprise", but not both.');
	}

	const type: string | undefined = options.type;

	if (type === undefined) {
		throw new Error(`Google reCAPTCHA option "type" is required. Expected one of: ${RECAPTCHA_TYPES.join(', ')}.`);
	}

	if (!RECAPTCHA_TYPES.includes(type)) {
		throw new Error(`Unknown Google reCAPTCHA type '${type}'. Expected one of: ${RECAPTCHA_TYPES.join(', ')}.`);
	}

	if ((type === 'enterprise') !== hasEnterpriseOptions) {
		const required = type === 'enterprise' ? 'enterprise' : 'secretKey';
		throw new Error(`Google reCAPTCHA type '${type}' requires the "${required}" option.`);
	}

	if (type === 'enterprise') {
		for (const key of ENTERPRISE_REQUIRED_KEYS) {
			if (!isNonEmptyString(options.enterprise?.[key])) {
				throw new Error(`Google reCAPTCHA option "enterprise.${key}" must be a non-empty string.`);
			}
		}
	} else if (!isNonEmptyString(options.secretKey)) {
		throw new Error('Google reCAPTCHA option "secretKey" must be a non-empty string.');
	}

	if (type === 'v2' && (options.score != null || options.actions != null)) {
		throw new Error('Google reCAPTCHA v2 does not support "score" and "actions" options.');
	}
}

const WHEN_NOT_CONFIGURED_VALUES: readonly unknown[] = [undefined, 'reject', 'skip'];

/** `forRootDeferred()`: keys are set only via `RecaptchaConfigRef.setOptions()`, so a half-applied config cannot slip in. */
export function validateDeferredOptions(options: GoogleRecaptchaDeferredModuleOptions): void | never {
	for (const key of RUNTIME_OPTION_KEYS) {
		if (options[key] !== undefined) {
			throw new Error(
				`GoogleRecaptchaModule.forRootDeferred() does not accept "${key}": set it via RecaptchaConfigRef.setOptions() or use forRoot().`
			);
		}
	}

	if (!WHEN_NOT_CONFIGURED_VALUES.includes(options.whenNotConfigured)) {
		throw new Error(`Unknown "whenNotConfigured" value '${String(options.whenNotConfigured)}'. Expected one of: reject, skip.`);
	}
}

const UNSUPPORTED_CHECKS_VALUES: readonly unknown[] = [undefined, 'reject', 'ignore'];

/** Options shared by `forRoot*()` that are not covered by types for JS users and untyped configs. */
export function validateCommonOptions(options: GoogleRecaptchaCommonModuleOptions): void | never {
	if (!UNSUPPORTED_CHECKS_VALUES.includes(options.unsupportedChecks)) {
		throw new Error(`Unknown "unsupportedChecks" value '${String(options.unsupportedChecks)}'. Expected one of: reject, ignore.`);
	}
}

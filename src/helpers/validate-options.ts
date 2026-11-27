import { xor } from './xor.js';
import { GoogleRecaptchaDeferredModuleOptions } from '../interfaces/google-recaptcha-module-options.js';
import {
	GoogleRecaptchaRuntimeOptions,
	GoogleRecaptchaType,
	GoogleRecaptchaValidatorOptions,
} from '../interfaces/google-recaptcha-validator-options.js';

/** Options replaced by `RecaptchaConfigRef.setOptions()` / reset by `clear()`; not accepted by `forRootDeferred()`. */
export const RUNTIME_OPTION_KEYS = [
	'type',
	'secretKey',
	'siteVerifyUrl',
	'enterprise',
	'score',
	'actions',
] as const satisfies readonly (keyof GoogleRecaptchaRuntimeOptions)[];

const RECAPTCHA_TYPES: readonly string[] = ['v2', 'v3', 'enterprise'] satisfies GoogleRecaptchaType[];

/**
 * Validates the type-dependent options (`type`, `secretKey`, `enterprise`, `score`, `actions`).
 * Types already guarantee these checks; they are for JS users and untyped configs (e.g. loaded from a database).
 */
export function validateOptions(options: Partial<GoogleRecaptchaValidatorOptions>): void | never {
	const hasEnterpriseOptions = !!Object.keys(options.enterprise || {}).length;
	if (!xor(!!options.secretKey, hasEnterpriseOptions)) {
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

import {
	GoogleRecaptchaConfig,
	GoogleRecaptchaDeferredModuleOptions,
	GoogleRecaptchaModuleOptions,
	GoogleRecaptchaWhenNotConfigured,
} from '../interfaces/google-recaptcha-module-options.js';
import { GoogleRecaptchaEnterpriseOptions } from '../interfaces/google-recaptcha-enterprise-options.js';
import { GoogleRecaptchaRuntimeOptions } from '../interfaces/google-recaptcha-validator-options.js';
import { ScoreValidator, SkipIfValue } from '../types.js';
import { RUNTIME_OPTION_KEYS, validateOptions } from '../helpers/validate-options.js';

export class RecaptchaConfigRef {
	get valueOf(): GoogleRecaptchaConfig {
		return this.value;
	}

	/** `false` while keys are not set: `forRootDeferred()` before `setOptions()`, or after `clear()`. */
	get isConfigured(): boolean {
		return this.value.type !== undefined;
	}

	/** Guard behaviour while not configured. */
	readonly whenNotConfigured: GoogleRecaptchaWhenNotConfigured;

	private value: GoogleRecaptchaConfig;

	/** Options are copied: setters never mutate the object passed by the user. */
	constructor(value: GoogleRecaptchaModuleOptions | GoogleRecaptchaDeferredModuleOptions) {
		const { whenNotConfigured, ...config } = value as GoogleRecaptchaDeferredModuleOptions;

		this.whenNotConfigured = whenNotConfigured ?? 'reject';
		this.value = config as GoogleRecaptchaConfig;
	}

	/**
	 * Replaces the type-dependent options at once and validates them, e.g. sets the keys after `forRootDeferred()`
	 * or switches between v2, v3 and Enterprise keys.
	 * Omitted `secretKey` / `siteVerifyUrl` / `enterprise` / `score` / `actions` are reset (not kept from the previous config).
	 * Other module options (`response`, `remoteIp`, `skipIf`, `debug`, `logger`, `axiosConfig`) are kept.
	 * @throws Error if the options are invalid; the current config stays unchanged.
	 */
	setOptions(options: GoogleRecaptchaRuntimeOptions): this {
		validateOptions(options);

		return this.replaceRuntimeOptions(options);
	}

	/** Resets the keys: the guard behaves according to `whenNotConfigured` until `setOptions()` is called. */
	clear(): this {
		return this.replaceRuntimeOptions({});
	}

	/**
	 * Keeps `type: 'v2'` / `'v3'`; switching from Enterprise results in reCAPTCHA v3.
	 * @throws Error if not configured: v2 or v3 is ambiguous, use `setOptions()`.
	 */
	setSecretKey(secretKey: string): this {
		const value = this.value;

		if (value.type === undefined) {
			throw this.notConfiguredError('setSecretKey');
		}

		this.value =
			value.type === 'v2'
				? { ...value, secretKey }
				: { ...value, type: value.type === 'enterprise' ? 'v3' : value.type, secretKey, enterprise: undefined };

		return this;
	}

	/** Switches to reCAPTCHA Enterprise: `secretKey` and `siteVerifyUrl` are reset. */
	setEnterpriseOptions(options: GoogleRecaptchaEnterpriseOptions): this {
		this.value = {
			...this.value,
			type: 'enterprise',
			enterprise: options,
			secretKey: undefined,
			siteVerifyUrl: undefined,
		};

		return this;
	}

	/**
	 * @throws Error for reCAPTCHA v2: its response has no score.
	 * @throws Error if not configured: use `setOptions()`.
	 */
	setScore(score: ScoreValidator): this {
		const value = this.value;

		if (value.type === undefined) {
			throw this.notConfiguredError('setScore');
		}

		if (value.type === 'v2') {
			throw new Error('Score is not supported for reCAPTCHA v2.');
		}

		this.value = { ...value, score };

		return this;
	}

	setSkipIf(skipIf: SkipIfValue): this {
		this.value = { ...this.value, skipIf };

		return this;
	}

	private replaceRuntimeOptions(options: Partial<GoogleRecaptchaRuntimeOptions>): this {
		const next: Record<string, unknown> = { ...this.value };

		for (const key of RUNTIME_OPTION_KEYS) {
			next[key] = options[key];
		}

		this.value = next as unknown as GoogleRecaptchaConfig;

		return this;
	}

	private notConfiguredError(method: string): Error {
		return new Error(`Google reCAPTCHA is not configured: ${method}() cannot be used before setOptions().`);
	}
}

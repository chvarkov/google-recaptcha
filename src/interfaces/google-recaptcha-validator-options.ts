import { GoogleRecaptchaSiteVerifyUrl } from '../enums/google-recaptcha-site-verify-url';
import { ScoreValidator } from '../types';
import { AxiosRequestConfig } from 'axios';
import { GoogleRecaptchaEnterpriseOptions } from './google-recaptcha-enterprise-options';

export type GoogleRecaptchaType = 'v2' | 'v3' | 'enterprise';

/** Validator options shared by all reCAPTCHA types. */
export interface GoogleRecaptchaCommonValidatorOptions {
	/**
	 * Config for the internal axios instance (proxy, timeout, https agent, etc.).
	 * Note: `headers` and request-specific fields (`url`, `baseURL`, `method`, `data`, `responseType`,
	 * `transformRequest`, `transformResponse`, `paramsSerializer`, `validateStatus`, `adapter`) are ignored.
	 */
	axiosConfig?: AxiosRequestConfig;
}

interface GoogleRecaptchaSiteVerifyOptions {
	secretKey: string;

	/**
	 * URL of the reCAPTCHA siteverify API. Default: `GoogleRecaptchaSiteVerifyUrl.Google`.
	 * If your server has trouble connecting to https://google.com then you can use:
	 * GoogleRecaptchaSiteVerifyUrl.Google = 'https://www.google.com/recaptcha/api/siteverify'
	 * GoogleRecaptchaSiteVerifyUrl.Recaptcha = 'https://recaptcha.net/recaptcha/api/siteverify'
	 * or any other URL (e.g. a proxy).
	 */
	siteVerifyUrl?: GoogleRecaptchaSiteVerifyUrl | string;

	enterprise?: never;
}

/** reCAPTCHA v2: no score and action in the response, so `score` and `actions` are not available. */
export interface GoogleRecaptchaV2ValidatorOptions extends GoogleRecaptchaCommonValidatorOptions, GoogleRecaptchaSiteVerifyOptions {
	type: 'v2';
	score?: never;
	actions?: never;
}

/** reCAPTCHA v3 (default for `secretKey` when `type` is not set). */
export interface GoogleRecaptchaV3ValidatorOptions extends GoogleRecaptchaCommonValidatorOptions, GoogleRecaptchaSiteVerifyOptions {
	type?: 'v3';
	score?: ScoreValidator;
	actions?: string[];
}

/** reCAPTCHA Enterprise: verification via the Google Cloud assessments API. */
export interface GoogleRecaptchaEnterpriseValidatorOptions extends GoogleRecaptchaCommonValidatorOptions {
	type?: 'enterprise';
	enterprise: GoogleRecaptchaEnterpriseOptions;
	score?: ScoreValidator;
	actions?: string[];
	secretKey?: never;
	siteVerifyUrl?: never;
}

export type GoogleRecaptchaValidatorOptions =
	GoogleRecaptchaV2ValidatorOptions | GoogleRecaptchaV3ValidatorOptions | GoogleRecaptchaEnterpriseValidatorOptions;

import { GoogleRecaptchaSiteVerifyUrl } from '../enums/google-recaptcha-site-verify-url';
import { ScoreValidator } from '../types';
import { AxiosRequestConfig } from 'axios';
import { GoogleRecaptchaEnterpriseOptions } from './google-recaptcha-enterprise-options';

export interface GoogleRecaptchaValidatorOptions {
	secretKey?: string;
	actions?: string[];
	score?: ScoreValidator;

	/**
	 * URL of the reCAPTCHA siteverify API (not used by Enterprise). Default: `GoogleRecaptchaSiteVerifyUrl.Google`.
	 * If your server has trouble connecting to https://google.com then you can use:
	 * GoogleRecaptchaSiteVerifyUrl.Google = 'https://www.google.com/recaptcha/api/siteverify'
	 * GoogleRecaptchaSiteVerifyUrl.Recaptcha = 'https://recaptcha.net/recaptcha/api/siteverify'
	 * or any other URL (e.g. a proxy).
	 */
	siteVerifyUrl?: GoogleRecaptchaSiteVerifyUrl | string;

	/**
	 * Config for the internal axios instance (proxy, timeout, https agent, etc.).
	 * Note: `headers` and request-specific fields (`url`, `baseURL`, `method`, `data`, `responseType`,
	 * `transformRequest`, `transformResponse`, `paramsSerializer`, `validateStatus`, `adapter`) are ignored.
	 */
	axiosConfig?: AxiosRequestConfig;

	enterprise?: GoogleRecaptchaEnterpriseOptions;
}

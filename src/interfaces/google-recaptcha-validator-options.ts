import { GoogleRecaptchaNetwork } from '../enums/google-recaptcha-network';
import { ScoreValidator } from '../types';
import { AxiosRequestConfig } from 'axios';
import { GoogleRecaptchaEnterpriseOptions } from './google-recaptcha-enterprise-options';

export interface GoogleRecaptchaValidatorOptions {
	secretKey?: string;
	actions?: string[];
	score?: ScoreValidator;

	/**
	 * If your server has trouble connecting to https://google.com then you can set networks:
	 * GoogleRecaptchaNetwork.Google = 'https://www.google.com/recaptcha/api/siteverify'
	 * GoogleRecaptchaNetwork.Recaptcha = 'https://recaptcha.net/recaptcha/api/siteverify'
	 * or set any api url
	 */
	network?: GoogleRecaptchaNetwork | string;

	/**
	 * Config for the internal axios instance (proxy, timeout, https agent, etc.).
	 * Note: `headers` and request-specific fields (`url`, `baseURL`, `method`, `data`, `responseType`,
	 * `transformRequest`, `transformResponse`, `paramsSerializer`, `validateStatus`, `adapter`) are ignored.
	 */
	axiosConfig?: AxiosRequestConfig;

	enterprise?: GoogleRecaptchaEnterpriseOptions;
}

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

	axiosConfig?: AxiosRequestConfig;

	enterprise?: GoogleRecaptchaEnterpriseOptions;
}

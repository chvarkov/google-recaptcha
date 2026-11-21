import { RecaptchaRemoteIpProvider, RecaptchaResponseProvider, ScoreValidator } from '../types';

export interface VerifyResponseDecoratorOptions {
	response?: RecaptchaResponseProvider;
	remoteIp?: RecaptchaRemoteIpProvider;
	score?: ScoreValidator;
	action?: string;
}

export interface VerifyResponseOptions {
	/** Missing token is sent as is: Google responds with `missing-input-response`. */
	response: string | undefined;
	remoteIp?: string;
	score?: ScoreValidator;
	action?: string;
}

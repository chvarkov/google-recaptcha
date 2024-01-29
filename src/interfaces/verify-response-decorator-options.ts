import { RecaptchaRemoteIpProvider, RecaptchaResponseProvider, ScoreValidator } from '../types';

export interface VerifyResponseDecoratorOptions {
	response?: RecaptchaResponseProvider;
	remoteIp?: RecaptchaRemoteIpProvider;
	score?: ScoreValidator;
	action?: string;
}

export interface VerifyResponseOptions {
	response: string;
	remoteIp?: string;
	score?: ScoreValidator;
	action?: string;
}

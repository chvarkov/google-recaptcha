import { RecaptchaRemoteIpProvider, RecaptchaResponseProvider, ScoreValidator, SkipIfValue } from '../types';

export interface GoogleRecaptchaGuardOptions {
	response: RecaptchaResponseProvider;
	remoteIp?: RecaptchaRemoteIpProvider;
	skipIf?: SkipIfValue;
	score?: ScoreValidator;
}

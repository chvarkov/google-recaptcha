import { RecaptchaRemoteIpProvider, RecaptchaResponseProvider, SkipIfValue } from '../types.js';

export interface GoogleRecaptchaGuardOptions {
	response: RecaptchaResponseProvider;
	remoteIp?: RecaptchaRemoteIpProvider;
	skipIf?: SkipIfValue;
}

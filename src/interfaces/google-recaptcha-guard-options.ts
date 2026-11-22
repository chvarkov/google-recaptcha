import { RecaptchaRemoteIpProvider, RecaptchaResponseProvider, SkipIfValue } from '../types';

export interface GoogleRecaptchaGuardOptions {
	response: RecaptchaResponseProvider;
	remoteIp?: RecaptchaRemoteIpProvider;
	skipIf?: SkipIfValue;
}

import { RecaptchaRemoteIpProvider, RecaptchaResponseProvider, ScoreValidator } from "../types";

export interface GoogleRecaptchaGuardOptions {
	response: RecaptchaResponseProvider;
	remoteIp?: RecaptchaRemoteIpProvider;
	skipIf?: boolean | (<Req = unknown>(request: Req) => boolean | Promise<boolean>);
	score?: ScoreValidator;
}

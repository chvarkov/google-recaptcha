import { RecaptchaResponseProvider, ScoreValidator } from '../types';

export interface GoogleRecaptchaGuardOptions {
	response: RecaptchaResponseProvider;
	skipIf?: boolean | (<Req = unknown>(request: Req) => boolean | Promise<boolean>);
	score?: ScoreValidator;
}

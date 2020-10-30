import { RecaptchaResponseProvider } from '../types';

export interface GoogleRecaptchaGuardOptions {
    response: RecaptchaResponseProvider;
    skipIf?: (request: any) => boolean | Promise<boolean>;
}

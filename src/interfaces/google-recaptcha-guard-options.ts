import { RecaptchaResponseProvider } from '../types';

export interface GoogleRecaptchaGuardOptions {
    response: RecaptchaResponseProvider;
    skipIf?: boolean | ((request: any) => boolean | Promise<boolean>);
}

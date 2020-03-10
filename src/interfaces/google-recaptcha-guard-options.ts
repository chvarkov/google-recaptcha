export interface GoogleRecaptchaGuardOptions {
    response: (req) => string | Promise<string>;
    skipIf?: (req) => boolean | Promise<boolean>;
}

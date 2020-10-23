export interface GoogleRecaptchaGuardOptions {
    response: (req) => string | Promise<string>;
    skipIf?: () => boolean | Promise<boolean>;
}

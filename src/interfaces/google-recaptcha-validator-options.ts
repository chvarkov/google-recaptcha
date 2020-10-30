import * as https from "https";

export interface GoogleRecaptchaValidatorOptions {
    secretKey: string;
    /**
     * If your server has trouble connecting to https://www.google.com,
     * set it to `true` to use https://recaptcha.net instead.
     */
    useRecaptchaNet?: boolean;
    /**
     * If your server has trouble connecting to https://www.google.com,
     * you can use an agent (`proxy-agent` or other NPM modules)
     */
    agent?: https.Agent;
}

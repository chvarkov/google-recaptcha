import * as https from "https";
import {GoogleRecaptchaNetwork} from "../enums/google-recaptcha-network";

export interface GoogleRecaptchaValidatorOptions {
    secretKey: string;
    /**
     * If your server has trouble connecting to https://google.com then you can set networks:
     * GoogleRecaptchaNetwork.Google = 'https://www.google.com/recaptcha/api/siteverify'
     * GoogleRecaptchaNetwork.Recaptcha = 'https://recaptcha.net/recaptcha/api/siteverify'
     * or set any api url
     */
    network?: GoogleRecaptchaNetwork | string;
    /**
     * If your server has trouble connecting to https://www.google.com,
     * you can use an agent (`proxy-agent` or other NPM modules)
     */
    agent?: https.Agent;
}

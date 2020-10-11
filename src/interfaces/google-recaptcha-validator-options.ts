import { ErrorHandler } from '../types';

export interface GoogleRecaptchaValidatorOptions {
    secretKey: string;
    onError?: ErrorHandler,
}

export interface GoogleRecaptchaValidatorOptions {
    secretKey: string;
    onError?: (errorCodes: string) => never,
}

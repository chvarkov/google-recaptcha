export interface GoogleRecaptchaValidatorOptions {
    secretKey: string;
    onError?: () => never,
}

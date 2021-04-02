import { RecaptchaResponseProvider, ScoreValidator } from '../types';

export interface VerifyResponseDecoratorOptions {
    response?: RecaptchaResponseProvider;
    score?: ScoreValidator;
    action?: string;
}

export interface VerifyResponseOptions {
    response: string;
    score?: ScoreValidator;
    action?: string;
}

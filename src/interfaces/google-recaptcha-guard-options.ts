import { RecaptchaResponseProvider, ScoreValidator } from '../types';
import { ApplicationType } from '../enums/application-type';

export interface GoogleRecaptchaGuardOptions {
    response: RecaptchaResponseProvider;
    applicationType?: ApplicationType;
    skipIf?: boolean | ((request: any) => boolean | Promise<boolean>);
    score?: ScoreValidator;
}

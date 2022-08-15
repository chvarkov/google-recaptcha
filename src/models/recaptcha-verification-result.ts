
import { ErrorCode } from '../enums/error-code';
import { VerifyResponseEnterprise } from '../interfaces/verify-response-enterprise';

export interface RecaptchaVerificationResultOptions<Res = any> {
    success: boolean;
    nativeResponse: Res;
    hostname: string;
    action?: string;
    score?: number;
    errors: ErrorCode[];
}

export class RecaptchaVerificationResult<Res = any> {
    readonly success: boolean;
    readonly hostname: string;
    readonly action: string | undefined;
    readonly score: number | undefined;
    readonly nativeResponse: Res;
    readonly errors: ErrorCode[];

    constructor(private readonly options: RecaptchaVerificationResultOptions) {
        this.success = options.success;
        this.hostname = options.hostname;
        this.action = options.action;
        this.score = options.score;
        this.errors = options.errors;
        this.nativeResponse = options.nativeResponse;
    }

    getResponse(): Res {
        return this.nativeResponse;
    }

    getEnterpriseRiskAnalytics(): VerifyResponseEnterprise | null {
        const res = this.getResponse();

        return res.hasOwnProperty('riskAnalysis')
            ? res['riskAnalysis']
            : null;
    }
}

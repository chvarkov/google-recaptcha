import { GoogleRecaptchaEnterpriseReason } from '../enums/google-recaptcha-enterprise-reason';
import { ClassificationReason } from '../enums/classification-reason';

export interface VerifyResponseEnterprise {
	tokenProperties?: VerifyResponseEnterpriseTokenProperties;
	riskAnalysis?: VerifyResponseEnterpriseRiskAnalysis;
	event: VerifyTokenEnterpriseResponseEvent;
	name: string;
}

export interface VerifyTokenEnterpriseEvent {
	token: string;
	siteKey: string;
	expectedAction: string;
}

export interface VerifyTokenEnterpriseResponseEvent extends VerifyTokenEnterpriseEvent {
	userAgent: string;
	userIpAddress: string;
	hashedAccountId: string;
}

export interface VerifyResponseEnterpriseTokenProperties {
	valid: boolean;
	invalidReason?: GoogleRecaptchaEnterpriseReason;
	hostname: string;
	action: string;
	createTime: string;
}

export interface VerifyResponseEnterpriseRiskAnalysis {
	score: number;
	reasons: ClassificationReason[];
}

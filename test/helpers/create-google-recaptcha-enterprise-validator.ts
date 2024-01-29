import { Logger } from '@nestjs/common';
import { GoogleRecaptchaEnterpriseValidator, GoogleRecaptchaModuleOptions } from '../../src';
import { EnterpriseReasonTransformer } from '../../src/services/enterprise-reason.transformer';
import axios from 'axios';
import { RecaptchaConfigRef } from '../../src/models/recaptcha-config-ref';

export function createGoogleRecaptchaEnterpriseValidator(options: GoogleRecaptchaModuleOptions): GoogleRecaptchaEnterpriseValidator {
	return new GoogleRecaptchaEnterpriseValidator(
		axios.create(),
		new Logger(),
		new RecaptchaConfigRef(options),
		new EnterpriseReasonTransformer(),
	);
}

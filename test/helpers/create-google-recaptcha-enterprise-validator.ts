import { Logger } from '@nestjs/common';
import { GoogleRecaptchaEnterpriseValidator, GoogleRecaptchaModuleOptions } from '../../src/index.js';
import { EnterpriseReasonTransformer } from '../../src/services/enterprise-reason.transformer.js';
import axios from 'axios';
import { RecaptchaConfigRef } from '../../src/models/recaptcha-config-ref.js';

export function createGoogleRecaptchaEnterpriseValidator(options: GoogleRecaptchaModuleOptions): GoogleRecaptchaEnterpriseValidator {
	return new GoogleRecaptchaEnterpriseValidator(
		axios.create(),
		new Logger(),
		new RecaptchaConfigRef(options),
		new EnterpriseReasonTransformer()
	);
}

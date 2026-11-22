import { GoogleRecaptchaModuleOptions, GoogleRecaptchaSiteVerifyUrl } from '../../src/index.js';
import * as https from 'https';

export class TestConfigService {
	getGoogleRecaptchaOptions(): GoogleRecaptchaModuleOptions {
		return {
			type: 'v3',
			secretKey: 'secret',
			response: (req) => req.body.recaptcha,
			skipIf: () => true,
			siteVerifyUrl: GoogleRecaptchaSiteVerifyUrl.Google,
			axiosConfig: {
				httpsAgent: new https.Agent({
					timeout: 15_000,
				}),
			},
		};
	}
}

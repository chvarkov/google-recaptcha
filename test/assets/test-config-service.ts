import { GoogleRecaptchaModuleOptions, GoogleRecaptchaSiteVerifyUrl } from '../../src';
import * as https from 'https';

export class TestConfigService {
	getGoogleRecaptchaOptions(): GoogleRecaptchaModuleOptions {
		return {
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

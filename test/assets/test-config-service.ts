import { GoogleRecaptchaModuleOptions, GoogleRecaptchaNetwork } from '../../src';
import * as https from 'https';

export class TestConfigService {
	getGoogleRecaptchaOptions(): GoogleRecaptchaModuleOptions {
		return {
			secretKey: 'secret',
			response: (req) => req.body.recaptcha,
			skipIf: () => true,
			network: GoogleRecaptchaNetwork.Google,
			axiosConfig: {
				httpsAgent: new https.Agent({
					timeout: 15_000,
				}),
			},
		};
	}
}

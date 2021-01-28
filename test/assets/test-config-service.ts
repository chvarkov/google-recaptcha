import { GoogleRecaptchaModuleOptions, GoogleRecaptchaNetwork } from '../../src';

export class TestConfigService {
    getGoogleRecaptchaOptions(): GoogleRecaptchaModuleOptions {
        return {
            secretKey: 'secret',
            response: req => req.body.recaptcha,
            skipIf: () => true,
            network: GoogleRecaptchaNetwork.Google,
            agent: null
        };
    }
}

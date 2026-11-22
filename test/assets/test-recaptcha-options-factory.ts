import { GoogleRecaptchaModuleOptions, GoogleRecaptchaOptionsFactory } from '../../src/interfaces/google-recaptcha-module-options.js';
import { TestConfigService } from './test-config-service.js';

export class GoogleRecaptchaModuleOptionsFactory implements GoogleRecaptchaOptionsFactory {
	createGoogleRecaptchaOptions(): Promise<GoogleRecaptchaModuleOptions> {
		return Promise.resolve(new TestConfigService().getGoogleRecaptchaOptions());
	}
}

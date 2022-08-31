import { GoogleRecaptchaModuleOptions, GoogleRecaptchaOptionsFactory } from '../../src/interfaces/google-recaptcha-module-options';
import { TestConfigService } from './test-config-service';

export class GoogleRecaptchaModuleOptionsFactory implements GoogleRecaptchaOptionsFactory {
	createGoogleRecaptchaOptions(): Promise<GoogleRecaptchaModuleOptions> {
		return Promise.resolve(new TestConfigService().getGoogleRecaptchaOptions());
	}
}

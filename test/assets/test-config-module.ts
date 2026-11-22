import { Module } from '@nestjs/common';
import { TestConfigService } from './test-config-service.js';
import { GoogleRecaptchaModuleOptionsFactory } from './test-recaptcha-options-factory.js';

@Module({
	providers: [TestConfigService, GoogleRecaptchaModuleOptionsFactory],
	exports: [TestConfigService, GoogleRecaptchaModuleOptionsFactory],
})
export class TestConfigModule {}

import { Module } from '@nestjs/common';
import { TestConfigService } from './test-config-service';
import { GoogleRecaptchaModuleOptionsFactory } from './test-recaptcha-options-factory';

@Module({
    providers: [
        TestConfigService,
        GoogleRecaptchaModuleOptionsFactory,
    ],
    exports: [
        TestConfigService,
        GoogleRecaptchaModuleOptionsFactory,
    ],
})
export class TestConfigModule {

}

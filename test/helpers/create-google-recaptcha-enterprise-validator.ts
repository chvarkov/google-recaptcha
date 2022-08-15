import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { GoogleRecaptchaEnterpriseValidator, GoogleRecaptchaModuleOptions } from '../../src';
import { EnterpriseReasonTransformer } from '../../src/services/enterprise-reason.transformer';

export function createGoogleRecaptchaEnterpriseValidator(options: GoogleRecaptchaModuleOptions): GoogleRecaptchaEnterpriseValidator {
    return new GoogleRecaptchaEnterpriseValidator(
        new HttpService(),
        new Logger(),
        options,
        new EnterpriseReasonTransformer(),
    );
}

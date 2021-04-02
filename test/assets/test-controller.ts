import { Controller } from '@nestjs/common';
import { Recaptcha } from '../../src';

@Controller('test')
export class TestController {
    @Recaptcha()
    submit(): void {}

    @Recaptcha({response: req => req.body.customRecaptchaField})
    submitOverridden(): void {}
}

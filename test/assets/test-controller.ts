import { Controller } from '@nestjs/common';
import { Recaptcha } from '../../src';

@Controller('test')
export class TestController {
    @Recaptcha()
    submit(): void {}

    @Recaptcha(req => req.body.customRecaptchaField)
    submitOverridden(): void {}
}

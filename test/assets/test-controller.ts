import { Controller, UseGuards } from '@nestjs/common';
import { GoogleRecaptchaGuard, Recaptcha } from '../../src';
import { SetRecaptchaOptions } from '../../src/decorators/set-recaptcha-options';

@Controller('test')
export class TestController {
    @Recaptcha()
    submit(): void {}

    @Recaptcha({response: req => req.body.customRecaptchaField})
    submitOverridden(): void {}

    @SetRecaptchaOptions({action: 'TestOptions', score: 0.5})
    @UseGuards(GoogleRecaptchaGuard)
    submitWithSetRecaptchaOptionsDecorator(): void {}
}

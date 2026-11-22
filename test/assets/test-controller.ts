import { Controller, UseGuards } from '@nestjs/common';
import { GoogleRecaptchaGuard, Recaptcha } from '../../src/index.js';
import { SetRecaptchaOptions } from '../../src/decorators/set-recaptcha-options.js';

@Controller('test')
export class TestController {
	@Recaptcha()
	submit(): void {
		return;
	}

	@Recaptcha({ response: (req) => req.body.customRecaptchaField })
	submitOverridden(): void {
		return;
	}

	@SetRecaptchaOptions({ action: 'TestOptions', score: 0.5 })
	@UseGuards(GoogleRecaptchaGuard)
	submitWithSetRecaptchaOptionsDecorator(): void {
		return;
	}
}

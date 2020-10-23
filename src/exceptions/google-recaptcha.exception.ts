import { BadRequestException } from '@nestjs/common';
import { ErrorCode } from '../enums/error-code';

export class GoogleRecaptchaException extends BadRequestException {
	constructor(public readonly errorCodes: ErrorCode[]) {
		super(`Google recaptcha errors: ${errorCodes.join(', ')}.`);
	}
}

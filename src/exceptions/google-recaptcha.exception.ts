import { ForbiddenException } from '@nestjs/common';
import { ErrorCode } from '../enums/error-code';

export class GoogleRecaptchaException extends ForbiddenException {
	constructor(public readonly errorCodes: ErrorCode[]) {
		super();
	}
}

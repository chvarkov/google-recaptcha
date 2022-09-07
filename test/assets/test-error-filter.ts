import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { GoogleRecaptchaException } from '../../src';
import { Response } from 'express';

@Catch(Error)
export class TestErrorFilter implements ExceptionFilter {
	catch(exception: Error, host: ArgumentsHost): void {
		const res: Response = host.switchToHttp().getResponse();

		if (exception instanceof GoogleRecaptchaException) {
			res.status(exception.getStatus()).send({
				errorCodes: exception.errorCodes,
			});

			return;
		}

		res.status(500).send({
			name: exception.name,
			message: exception.message,
			stack: exception.stack,
		});
	}
}

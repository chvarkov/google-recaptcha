import { ExecutionContext, Injectable } from '@nestjs/common';
import { resolveRequest } from '../helpers/resolve-request';

@Injectable()
export class RecaptchaRequestResolver {
	resolve<T>(context: ExecutionContext): T {
		return resolveRequest<T>(context);
	}
}

import {
    BadGatewayException,
    BadRequestException,
    CanActivate,
    ExecutionContext,
    ForbiddenException, HttpException,
    Inject,
    Injectable
} from '@nestjs/common';
import { GoogleRecaptchaValidator } from '../services/google-recaptcha.validator';
import { GoogleRecaptchaGuardOptions } from '../interfaces/google-recaptcha-guard-options';
import { RECAPTCHA_OPTIONS } from '../provider.declarations';
import { ErrorCode } from '../enums/error-code';

@Injectable()
export class GoogleRecaptchaGuard implements CanActivate {
    constructor(private readonly validator: GoogleRecaptchaValidator,
                @Inject(RECAPTCHA_OPTIONS) private readonly options: GoogleRecaptchaGuardOptions) {
    }

    async canActivate(context: ExecutionContext): Promise<true | never> {
        const request = context.switchToHttp().getRequest();

        const skip = this.options.skipIf ? await this.options.skipIf() : false;

        if (skip) {
            return true;
        }

        const response = await this.options.response(request);

        const result = await this.validator.validate(response);

        if (result.success) {
            return true;
        }

        const error = this.options.onError
            ? this.options.onError(result.errors)
            : this.errorHandler(result.errors);

        if (error instanceof Error) {
            throw error;
        }

        throw new BadRequestException(error);
    }

    errorHandler(errorCodes: ErrorCode[]): string | HttpException {
        const first = errorCodes.shift();

        switch (first) {
            case ErrorCode.MissingInputSecret:
                return 'The secret parameter is missing.';

            case ErrorCode.InvalidInputSecret:
                return 'The secret parameter is invalid or malformed.';

            case ErrorCode.MissingInputResponse:
                return 'The response parameter is missing.';

            case ErrorCode.InvalidInputResponse:
                return 'The response parameter is invalid or malformed.';

            case ErrorCode.BadRequest:
                return 'The request is invalid or malformed.';

            case ErrorCode.TimeoutOrDuplicate:
                return 'The response is no longer valid: either is too old or has been used previously.';

            case ErrorCode.UnknownError:
            default:
                return new BadGatewayException('Unknown error when checking captcha.');
        }
    }
}

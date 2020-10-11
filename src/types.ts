import { ErrorCode } from './enums/error-code';
import { HttpException } from '@nestjs/common';

export type ErrorHandler = (errorCodes: ErrorCode[]) => HttpException | string;

import { LiteralObject } from '@nestjs/common';
import * as axios from 'axios';

export function isAxiosError(error: Error | axios.AxiosError): error is axios.AxiosError {
    return (<axios.AxiosError>error).isAxiosError;
}

export function getErrorInfo(error: Error): string | LiteralObject {
    if (isAxiosError(error)) {
        return error.response?.data || error.code || 'Unknown axios error';
    }

    return {error: error.name, message: error.message, stack: error.stack};
}

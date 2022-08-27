import { getErrorInfo } from '../src/helpers/get-error-info';
import { LiteralObject } from '@nestjs/common';
import { AxiosError } from 'axios';

describe('getErrorInfo', () => {
    test('Error', () => {
        const err = new Error('Test error');

        const info = getErrorInfo(err) as LiteralObject;

        expect(typeof info).toBe('object')
        expect(info.error).toBe(err.name);
        expect(info.message).toBe(err.message);
        expect(info.stack).toBe(err.stack);
    });

    test('Axios error data', () => {
        const err: Partial<AxiosError<LiteralObject>> = {
            isAxiosError: true,
            name: 'AxiosError',
            stack: new Error().stack,
            message: 'Request was failed',
            response: {
                headers: {},
                status: 400,
                config: {},
                request: {},
                statusText: 'Bad request',
                data: {
                    success: false,
                    message: 'Invalid credentials',
                },
            },
        };

        const info = getErrorInfo(err as AxiosError) as LiteralObject;

        expect(typeof info).toBe('object')
        expect(info.success).toBeFalsy();
        expect(info.message).toBe(err.response.data.message);
    });

    test('Axios error code', () => {
        const err: Partial<AxiosError> = {
            code: 'ECONNRESET',
            isAxiosError: true,
            name: 'AxiosError',
            stack: new Error().stack,
            message: 'Request was failed'
        };

        const info = getErrorInfo(err as AxiosError) as string;

        expect(typeof info).toBe('string')
        expect(info).toBe(err.code);
    });

    test('Axios unknown error', () => {
        const err: Partial<AxiosError> = {
            isAxiosError: true,
        };

        const info = getErrorInfo(err as AxiosError) as string;

        expect(typeof info).toBe('string')
        expect(info).toBe('Unknown axios error');
    });
});

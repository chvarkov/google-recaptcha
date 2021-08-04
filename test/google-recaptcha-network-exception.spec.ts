import { HttpStatus } from '@nestjs/common';
import { GoogleRecaptchaNetworkException } from '../src/exceptions/google-recaptcha-network.exception';

describe('Google recaptcha network exception', () => {
    test('Test without error code', () => {
        const exception = new GoogleRecaptchaNetworkException();
        expect(exception.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(exception.message).toBe('Unknown network error.');
    });

    test('Test with error code', () => {
        const errCode = 'ECONNRESET';
        const exception = new GoogleRecaptchaNetworkException(errCode);
        expect(exception.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(exception.message.toString().includes(errCode)).toBeTruthy();
    });
});

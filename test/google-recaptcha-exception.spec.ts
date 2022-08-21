import { ErrorCode, GoogleRecaptchaException } from '../src';
import { HttpStatus } from '@nestjs/common';

describe('Google recaptcha exception', () => {
    test('Test error code InvalidInputResponse', () => {
        const exception = new GoogleRecaptchaException([ErrorCode.InvalidInputResponse]);
        expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    test('Test error code MissingInputResponse', () => {
        const exception = new GoogleRecaptchaException([ErrorCode.MissingInputResponse]);
        expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    test('Test error code TimeoutOrDuplicate', () => {
        const exception = new GoogleRecaptchaException([ErrorCode.TimeoutOrDuplicate]);
        expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    test('Test error code InvalidInputSecret', () => {
        const exception = new GoogleRecaptchaException([ErrorCode.InvalidInputSecret]);
        expect(exception.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    test('Test error code MissingInputSecret', () => {
        const exception = new GoogleRecaptchaException([ErrorCode.MissingInputSecret]);
        expect(exception.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    test('Test error code BadRequest', () => {
        const exception = new GoogleRecaptchaException([ErrorCode.BadRequest]);
        expect(exception.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    test('Test error code SiteMismatch', () => {
        const exception = new GoogleRecaptchaException([ErrorCode.SiteMismatch]);
        expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    test('Test error code BrowserError', () => {
        const exception = new GoogleRecaptchaException([ErrorCode.BrowserError]);
        expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    test('Test error code IncorrectCaptchaSol', () => {
        const exception = new GoogleRecaptchaException([ErrorCode.IncorrectCaptchaSol]);
        expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    test('Test error code UnknownError', () => {
        const exception = new GoogleRecaptchaException([ErrorCode.UnknownError]);
        expect(exception.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    test('Test unexpected error code', () => {
        const exception = new GoogleRecaptchaException(['UnexpectedErrorCode' as ErrorCode]);
        expect(exception.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    test('Test network error code', () => {
        const exception = new GoogleRecaptchaException([ErrorCode.NetworkError]);
        expect(exception.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    test('Test network error with custom message', () => {
        const message = 'TEST_MSG';
        const exception = new GoogleRecaptchaException([ErrorCode.NetworkError], message);
        expect(exception.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(exception.message).toBe(message);
    });
});

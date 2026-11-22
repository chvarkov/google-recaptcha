import { Test } from '@nestjs/testing';
import { ErrorCode, GoogleRecaptchaModule } from '../src';
import { GoogleRecaptchaValidator } from '../src/services/validators/google-recaptcha.validator';
import { GoogleRecaptchaNetworkException } from '../src/exceptions/google-recaptcha-network.exception';
import { RecaptchaConfigRef } from '../src/models/recaptcha-config-ref';
import { AxiosError, AxiosHeaders, AxiosInstance } from 'axios';
import { Logger } from '@nestjs/common';
import { inspect } from 'node:util';

describe('Google recaptcha validator', () => {
	test('Invalid secret', async () => {
		const module = await Test.createTestingModule({
			imports: [
				GoogleRecaptchaModule.forRoot({
					response: () => 'TEST_TOKEN',
					type: 'v3',
					secretKey: 'TEST_SECRET',
				}),
			],
		}).compile();

		const app = module.createNestApplication();

		const validator = app.get(GoogleRecaptchaValidator);
		expect(validator).toBeDefined();
		expect(validator).toBeInstanceOf(GoogleRecaptchaValidator);

		const result = await validator.validate({ response: 'TEST_TOKEN' });

		expect(result).toBeDefined();
		expect(result.success).toBeFalsy();
		expect(result.errors).toBeInstanceOf(Array);
		expect(result.errors.length).toBe(1);
		expect(result.errors[0]).toBe(ErrorCode.InvalidInputResponse);
	});

	test('Network error', async () => {
		const module = await Test.createTestingModule({
			imports: [
				GoogleRecaptchaModule.forRoot({
					response: () => 'TEST_TOKEN',
					type: 'v3',
					secretKey: 'TEST_SECRET',
					axiosConfig: {
						proxy: {
							port: 5555,
							host: 'invalidhost',
						},
					},
				}),
			],
		}).compile();

		const app = module.createNestApplication();

		const validator = app.get(GoogleRecaptchaValidator);
		expect(validator).toBeDefined();
		expect(validator).toBeInstanceOf(GoogleRecaptchaValidator);

		await expect(validator.validate({ response: 'TEST_TOKEN' })).rejects.toThrow(GoogleRecaptchaNetworkException);
	});
});

describe('Google recaptcha validator debug logging', () => {
	test('Does not log secret key', async () => {
		const secretKey = '6LeIxAATAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';
		const axiosMock = {
			post: vi.fn().mockResolvedValue({ data: { success: true, hostname: 'localhost' } }),
		} as unknown as AxiosInstance;
		const logger = { debug: vi.fn() } as unknown as Logger;
		const configRef = new RecaptchaConfigRef({ type: 'v3', secretKey, debug: true, response: () => 'TEST_TOKEN' });

		const validator = new GoogleRecaptchaValidator(axiosMock, logger, configRef);
		await validator.validate({ response: 'TEST_TOKEN', remoteIp: '127.0.0.1' });

		const debugMock = vi.mocked(logger.debug);

		expect(debugMock).toHaveBeenCalledWith(
			{ body: { secret: '6Le******JWe', response: 'TEST_TOKEN', remoteip: '127.0.0.1' } },
			'GoogleRecaptcha.request'
		);

		for (const args of debugMock.mock.calls) {
			expect(inspect(args, { depth: null })).not.toContain(secretKey);
		}

		// Secret must still be sent to Google.
		const sentBody = vi.mocked(axiosMock.post).mock.calls[0][1] as URLSearchParams;
		expect(sentBody.get('secret')).toBe(secretKey);
	});
});

describe('Google recaptcha validator: HTTP handling', () => {
	function create(post: () => Promise<unknown>, debug = true) {
		const logger = { debug: vi.fn() } as unknown as Logger;
		const configRef = new RecaptchaConfigRef({ type: 'v3', secretKey: 'SECRET', debug, response: () => 'TOKEN' });
		const validator = new GoogleRecaptchaValidator({ post: vi.fn(post) } as unknown as AxiosInstance, logger, configRef);

		return { validator, debugMock: vi.mocked(logger.debug) };
	}

	test('HTTP error returns UnknownError', async () => {
		const err = new AxiosError(
			'Server error',
			'ERR_BAD_RESPONSE',
			undefined,
			{},
			{
				status: 500,
				statusText: 'Internal Server Error',
				data: 'oops',
				headers: {},
				config: { headers: new AxiosHeaders() },
			}
		);
		const { validator, debugMock } = create(() => Promise.reject(err));

		const result = await validator.validate({ response: 'TOKEN' });

		expect(result.success).toBe(false);
		expect(result.errors).toEqual([ErrorCode.UnknownError]);
		expect(debugMock).toHaveBeenCalledWith('oops', 'GoogleRecaptcha.error');
	});

	test('Empty response body returns UnknownError', async () => {
		const { validator } = create(() => Promise.resolve({ data: null }));

		const result = await validator.validate({ response: 'TOKEN' });

		expect(result.success).toBe(false);
		expect(result.errors).toEqual([ErrorCode.UnknownError]);
	});

	test('Network error throws GoogleRecaptchaNetworkException', async () => {
		const err = new AxiosError('connect ECONNREFUSED', 'ECONNREFUSED');
		const { validator } = create(() => Promise.reject(err));

		await expect(validator.validate({ response: 'TOKEN' })).rejects.toThrow(GoogleRecaptchaNetworkException);
	});

	test('error-codes are mapped to errors', async () => {
		const { validator } = create(() =>
			Promise.resolve({ data: { success: false, hostname: 'localhost', 'error-codes': [ErrorCode.TimeoutOrDuplicate] } })
		);

		const result = await validator.validate({ response: 'TOKEN' });

		expect(result.errors).toEqual([ErrorCode.TimeoutOrDuplicate]);
		expect(result.nativeResponse).not.toHaveProperty('error-codes');
	});

	test('Nothing is logged when debug is disabled', async () => {
		const { validator, debugMock } = create(() => Promise.resolve({ data: { success: true, hostname: 'localhost' } }), false);

		await validator.validate({ response: 'TOKEN' });

		expect(debugMock).not.toHaveBeenCalled();
	});

	test('Missing token and secret are sent as empty strings', async () => {
		const post = vi.fn().mockResolvedValue({ data: { success: false, 'error-codes': [ErrorCode.MissingInputResponse] } });
		const configRef = new RecaptchaConfigRef({
			type: 'enterprise',
			enterprise: { projectId: 'p', siteKey: 's', apiKey: 'k' },
			response: () => undefined,
		});
		const validator = new GoogleRecaptchaValidator({ post } as unknown as AxiosInstance, new Logger(), configRef);

		const result = await validator.validate({ response: undefined });

		const sentBody = post.mock.calls[0][1] as URLSearchParams;
		expect(sentBody.get('secret')).toBe('');
		expect(sentBody.get('response')).toBe('');
		expect(result.errors).toEqual([ErrorCode.MissingInputResponse]);
	});
});

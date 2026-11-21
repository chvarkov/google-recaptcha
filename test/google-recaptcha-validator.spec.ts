import { Test } from '@nestjs/testing';
import { ErrorCode, GoogleRecaptchaModule } from '../src';
import { GoogleRecaptchaValidator } from '../src/services/validators/google-recaptcha.validator';
import { GoogleRecaptchaNetworkException } from '../src/exceptions/google-recaptcha-network.exception';
import { RecaptchaConfigRef } from '../src/models/recaptcha-config-ref';
import { AxiosInstance } from 'axios';
import { Logger } from '@nestjs/common';
import { inspect } from 'node:util';

describe('Google recaptcha validator', () => {
	test('Invalid secret', async () => {
		const module = await Test.createTestingModule({
			imports: [
				GoogleRecaptchaModule.forRoot({
					response: () => 'TEST_TOKEN',
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
		const configRef = new RecaptchaConfigRef({ secretKey, debug: true, response: () => 'TEST_TOKEN' });

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

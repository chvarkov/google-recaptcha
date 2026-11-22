import { Logger } from '@nestjs/common';
import { AxiosError, AxiosHeaders, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { inspect } from 'node:util';
import { GoogleRecaptchaEnterpriseValidator } from '../src/services/validators/google-recaptcha-enterprise.validator';
import { RecaptchaConfigRef } from '../src/models/recaptcha-config-ref';
import { EnterpriseReasonTransformer } from '../src/services/enterprise-reason.transformer';
import { GoogleRecaptchaNetworkException } from '../src/exceptions/google-recaptcha-network.exception';
import { ErrorCode } from '../src';

const API_KEY = 'SUPER_SECRET_ENTERPRISE_API_KEY';

const requestConfig: InternalAxiosRequestConfig = {
	url: `https://recaptchaenterprise.googleapis.com/v1/projects/p/assessments?key=${API_KEY}`,
	params: { key: API_KEY },
	headers: new AxiosHeaders(),
};

function createValidator(post: () => Promise<unknown>): { validator: GoogleRecaptchaEnterpriseValidator; logs: string } {
	const logged: unknown[] = [];
	const logger = { debug: (...args: unknown[]) => logged.push(...args) } as unknown as Logger;
	const configRef = new RecaptchaConfigRef({
		response: () => 'TOKEN',
		debug: true,
		enterprise: { projectId: 'p', siteKey: 'site', apiKey: API_KEY },
	});
	const validator = new GoogleRecaptchaEnterpriseValidator(
		{ post } as unknown as AxiosInstance,
		logger,
		configRef,
		new EnterpriseReasonTransformer()
	);

	return {
		validator,
		get logs() {
			return logged.map((v) => inspect(v, { depth: null })).join('\n');
		},
	};
}

describe('Google recaptcha enterprise validator: api key is never logged', () => {
	test('HTTP error response', async () => {
		const err = new AxiosError(
			'Request failed',
			'ERR_BAD_REQUEST',
			requestConfig,
			{},
			{
				status: 403,
				statusText: 'Forbidden',
				data: { error: { message: 'API key not valid' } },
				headers: {},
				config: requestConfig,
			}
		);
		const ctx = createValidator(() => Promise.reject(err));

		const result = await ctx.validator.validate({ response: 'TOKEN' });

		expect(result.success).toBe(false);
		expect(result.errors).toEqual([ErrorCode.UnknownError]);
		expect(result.nativeResponse).toBeUndefined();
		expect(result.getResponse()).toBeUndefined();
		expect(result.getEnterpriseRiskAnalytics()).toBeNull();
		expect(ctx.logs).not.toContain(API_KEY);
	});

	test('Network error', async () => {
		const err = new AxiosError('connect ECONNREFUSED', 'ECONNREFUSED', requestConfig, {});
		const ctx = createValidator(() => Promise.reject(err));

		await expect(ctx.validator.validate({ response: 'TOKEN' })).rejects.toThrow(GoogleRecaptchaNetworkException);
		expect(ctx.logs).not.toContain(API_KEY);
	});

	test('Successful request', async () => {
		const ctx = createValidator(() =>
			Promise.resolve({ data: { tokenProperties: { valid: true, action: 'Submit' }, riskAnalysis: { score: 0.9 } } })
		);

		await ctx.validator.validate({ response: 'TOKEN' });

		expect(ctx.logs).not.toContain(API_KEY);
	});
});

describe('Google recaptcha enterprise validator: non-axios errors', () => {
	test('Exception inside response handler returns UnknownError instead of TypeError', async () => {
		const logger = {
			debug: (_: unknown, ctx: string) => {
				if (ctx.endsWith('.response')) throw new Error('logger is broken');
			},
		} as unknown as Logger;
		const configRef = new RecaptchaConfigRef({
			response: () => 'TOKEN',
			debug: true,
			enterprise: { projectId: 'p', siteKey: 'site', apiKey: API_KEY },
		});
		const post = () => Promise.resolve({ data: { tokenProperties: { valid: true, action: 'Submit' } } });
		const validator = new GoogleRecaptchaEnterpriseValidator(
			{ post } as unknown as AxiosInstance,
			logger,
			configRef,
			new EnterpriseReasonTransformer()
		);

		const result = await validator.validate({ response: 'TOKEN' });

		expect(result.success).toBe(false);
		expect(result.errors).toEqual([ErrorCode.UnknownError]);
	});
});

describe('Google recaptcha enterprise validator: misconfiguration', () => {
	test('Throws when enterprise options are missing', async () => {
		const configRef = new RecaptchaConfigRef({ response: () => 'TOKEN', secretKey: 'SECRET' });
		const post = vi.fn();
		const validator = new GoogleRecaptchaEnterpriseValidator(
			{ post } as unknown as AxiosInstance,
			new Logger(),
			configRef,
			new EnterpriseReasonTransformer()
		);

		await expect(validator.validate({ response: 'TOKEN' })).rejects.toThrow('Google reCAPTCHA Enterprise options are not configured.');
		expect(post).not.toHaveBeenCalled();
	});
});

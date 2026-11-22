import { RecaptchaRequestResolver } from '../src/services/recaptcha-request.resolver.js';
import { createExecutionContext } from './helpers/create-execution-context.js';

describe('RecaptchaRequestResolver', () => {
	const resolver = new RecaptchaRequestResolver();

	test('Negative', () => {
		expect(() => resolver.resolve(createExecutionContext(() => null, null, 'unsupported'))).toThrow('Unsupported request type');
	});
});

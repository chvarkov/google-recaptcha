import { createExecutionContext } from './helpers/create-execution-context';
import { TestController } from './assets/test-controller';
import { Reflector } from '@nestjs/core';
import { RECAPTCHA_VALIDATION_OPTIONS } from '../src/provider.declarations';
import { VerifyResponseDecoratorOptions } from '../src/interfaces/verify-response-decorator-options';

describe('Set recaptcha options decorator', () => {
	let controller: TestController;
	let reflector: Reflector;

	beforeAll(async () => {
		controller = new TestController();
		reflector = new Reflector();
	});

	test('Test options', () => {
		const executionContext = createExecutionContext(controller.submitWithSetRecaptchaOptionsDecorator, {});
		const handler = executionContext.getHandler();

		const options: VerifyResponseDecoratorOptions = reflector.get(RECAPTCHA_VALIDATION_OPTIONS, handler);

		expect(options.response).toBeUndefined();
		expect(options.action).toBe('TestOptions');
		expect(options.score).toBe(0.5);
	});
});

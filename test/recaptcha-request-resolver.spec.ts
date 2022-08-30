import { RecaptchaRequestResolver } from '../src/services/recaptcha-request.resolver';
import { createExecutionContext } from './helpers/create-execution-context';

describe('RecaptchaRequestResolver', () => {
    const resolver = new RecaptchaRequestResolver();

    test('Negative', () => {
        expect(() => resolver.resolve(createExecutionContext(() => null, null, 'unsupported')))
            .toThrowError('Unsupported request type');
    });
});

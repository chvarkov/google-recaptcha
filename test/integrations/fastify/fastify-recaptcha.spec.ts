import { Controller, Module, Post } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { MercuriusDriver, MercuriusDriverConfig } from '@nestjs/mercurius';
import { Args, Field, GraphQLModule, Mutation, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { FastifyRequest } from 'fastify';
import { GoogleRecaptchaModule, Recaptcha, RecaptchaResult, RecaptchaVerificationResult } from '../../../src/index.js';
import { RECAPTCHA_AXIOS_INSTANCE } from '../../../src/provider.declarations.js';
import { VerifyResponseV3 } from '../../../src/interfaces/verify-response.js';
import { MockedRecaptchaApi } from '../../utils/mocked-recaptcha-api.js';

// Resolvers live in a separate TestModule that does not import GoogleRecaptchaModule.
const recaptchaOptions = {
	global: true,
	type: 'v3' as const,
	secretKey: 'secret_key',
	actions: ['Submit'],
	score: 0.6,
	// Typed with FastifyRequest: the provider must receive the Fastify request, not the raw IncomingMessage.
	response: (req: FastifyRequest): string | undefined => req.headers.recaptcha?.toString(),
	remoteIp: (req: FastifyRequest): string => req.ip,
};

function v3Response(action: string, score = 0.9): VerifyResponseV3 {
	return { success: true, hostname: 'localhost', challenge_ts: new Date().toISOString(), action, score, errors: [] };
}

async function createApp(
	imports: unknown[],
	controllers: unknown[],
	providers: unknown[],
	api: MockedRecaptchaApi
): Promise<NestFastifyApplication> {
	const moduleRef = await Test.createTestingModule({
		imports: [GoogleRecaptchaModule.forRoot(recaptchaOptions), ...(imports as [])],
		controllers: controllers as [],
		providers: providers as [],
	})
		.overrideProvider(RECAPTCHA_AXIOS_INSTANCE)
		.useFactory({ factory: () => api.getAxios() })
		.compile();

	const app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter(), { logger: false });
	await app.init();
	await app.getHttpAdapter().getInstance().ready();

	return app;
}

describe('Fastify: REST', () => {
	@Controller('test')
	class TestController {
		@Recaptcha()
		@Post('submit')
		submit(@RecaptchaResult() result: RecaptchaVerificationResult): { success: boolean; remoteIp?: string; action?: string } {
			return { success: result.success, remoteIp: result.remoteIp, action: result.action };
		}
	}

	const api = new MockedRecaptchaApi();
	let app: NestFastifyApplication;

	beforeAll(async () => {
		app = await createApp([], [TestController], [], api);
	});

	afterAll(() => app.close());

	test('Valid token: guard passes, @RecaptchaResult() receives the result', async () => {
		api.addResponse('fastify_rest_ok', v3Response('Submit'));

		const res = await app.inject({ method: 'POST', url: '/test/submit', headers: { recaptcha: 'fastify_rest_ok' } });

		expect(res.statusCode).toBe(201);
		expect(res.json()).toEqual({ success: true, remoteIp: '127.0.0.1', action: 'Submit' });
	});

	test('Forbidden action: 400 with GoogleRecaptchaException message', async () => {
		api.addResponse('fastify_rest_bad_action', v3Response('Login'));

		const res = await app.inject({ method: 'POST', url: '/test/submit', headers: { recaptcha: 'fastify_rest_bad_action' } });

		expect(res.statusCode).toBe(400);
		expect(res.json().message).toBe('Forbidden reCAPTCHA action.');
	});
});

@ObjectType()
class Feedback {
	@Field()
	title!: string;

	@Field({ nullable: true })
	remoteIp?: string;
}

@Resolver(() => Feedback)
class FeedbackResolver {
	@Query(() => String)
	ping(): string {
		return 'pong';
	}

	@Recaptcha()
	@Mutation(() => Feedback)
	submitFeedback(@Args('title') title: string, @RecaptchaResult() result: RecaptchaVerificationResult): Feedback {
		expect(result).toBeInstanceOf(RecaptchaVerificationResult);

		return { title, remoteIp: result.remoteIp };
	}
}

const mutation = 'mutation { submitFeedback(title: "TEST") { title remoteIp } }';

// The Nest Mercurius driver always adds the Fastify request to the context as `req`
// (also when a custom context function returns an object without it).
describe.each([
	['default context', undefined],
	['custom context without req', (): Record<string, unknown> => ({ user: 'test' })],
])('Fastify: GraphQL (Mercurius), %s', (_, context) => {
	@Module({ providers: [FeedbackResolver] })
	class TestModule {}

	const api = new MockedRecaptchaApi();
	let app: NestFastifyApplication;

	beforeAll(async () => {
		app = await createApp(
			[
				TestModule,
				GraphQLModule.forRoot<MercuriusDriverConfig>({
					driver: MercuriusDriver,
					include: [TestModule],
					autoSchemaFile: true,
					...(context ? { context } : {}),
				}),
			],
			[],
			[],
			api
		);
	});

	afterAll(() => app.close());

	test('Valid token: mutation resolves, @RecaptchaResult() receives the result', async () => {
		api.addResponse('fastify_gql_ok', v3Response('Submit'));

		const res = await app.inject({
			method: 'POST',
			url: '/graphql',
			headers: { recaptcha: 'fastify_gql_ok' },
			payload: { query: mutation },
		});

		expect(res.json()).toEqual({ data: { submitFeedback: { title: 'TEST', remoteIp: '127.0.0.1' } } });
	});

	test('Low score: mutation fails with GoogleRecaptchaException', async () => {
		api.addResponse('fastify_gql_low_score', v3Response('Submit', 0.1));

		const res = await app.inject({
			method: 'POST',
			url: '/graphql',
			headers: { recaptcha: 'fastify_gql_low_score' },
			payload: { query: mutation },
		});

		const body = res.json();
		expect(body.data).toBeNull();
		expect(body.errors[0].message).toBe('Low reCAPTCHA score.');
	});
});

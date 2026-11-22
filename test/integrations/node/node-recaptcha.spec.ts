import { Controller, INestApplication, Module, Post } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { NodeAdapter, NodeRequest } from '@nestjs/platform-node';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Args, Field, GraphQLModule, Mutation, ObjectType, Query, Resolver } from '@nestjs/graphql';
import request from 'supertest';
import { GoogleRecaptchaModule, Recaptcha, RecaptchaResult, RecaptchaVerificationResult } from '../../../src/index.js';
import { RECAPTCHA_AXIOS_INSTANCE } from '../../../src/provider.declarations.js';
import { VerifyResponseV3 } from '../../../src/interfaces/verify-response.js';
import { MockedRecaptchaApi } from '../../utils/mocked-recaptcha-api.js';

const recaptchaOptions = {
	type: 'v3' as const,
	secretKey: 'secret_key',
	actions: ['Submit'],
	score: 0.6,
	// Typed with NodeRequest: the provider must receive the adapter's request object.
	response: (req: NodeRequest): string | undefined => req.headers.recaptcha?.toString(),
	remoteIp: (req: NodeRequest): string | undefined => req.ip,
};

function v3Response(action: string, score = 0.9): VerifyResponseV3 {
	return { success: true, hostname: 'localhost', challenge_ts: new Date().toISOString(), action, score, errors: [] };
}

async function createApp(metadata: { imports?: unknown[]; controllers?: unknown[] }, api: MockedRecaptchaApi): Promise<INestApplication> {
	const moduleRef = await Test.createTestingModule({
		imports: [GoogleRecaptchaModule.forRoot(recaptchaOptions), ...((metadata.imports ?? []) as [])],
		controllers: (metadata.controllers ?? []) as [],
	})
		.overrideProvider(RECAPTCHA_AXIOS_INSTANCE)
		.useFactory({ factory: () => api.getAxios() })
		.compile();

	const app = moduleRef.createNestApplication(new NodeAdapter(), { logger: false });
	await app.init();

	return app;
}

describe('Node adapter (@nestjs/platform-node): REST', () => {
	@Controller('test')
	class TestController {
		@Recaptcha()
		@Post('submit')
		submit(@RecaptchaResult() result: RecaptchaVerificationResult): { success: boolean; remoteIp?: string; action?: string } {
			return { success: result.success, remoteIp: result.remoteIp, action: result.action };
		}
	}

	const api = new MockedRecaptchaApi();
	let app: INestApplication;

	beforeAll(async () => {
		app = await createApp({ controllers: [TestController] }, api);
	});

	afterAll(() => app.close());

	test('Valid token: guard passes, @RecaptchaResult() receives the result', async () => {
		api.addResponse('node_rest_ok', v3Response('Submit'));

		const res = await request(app.getHttpServer()).post('/test/submit').set('recaptcha', 'node_rest_ok');

		expect(res.status).toBe(201);
		expect(res.body.success).toBe(true);
		expect(res.body.action).toBe('Submit');
		// Loopback address: IPv4 or IPv4-mapped IPv6, depending on the environment.
		expect(res.body.remoteIp).toMatch(/127\.0\.0\.1|::1/);
	});

	test('Forbidden action: 400 with GoogleRecaptchaException message', async () => {
		api.addResponse('node_rest_bad_action', v3Response('Login'));

		const res = await request(app.getHttpServer()).post('/test/submit').set('recaptcha', 'node_rest_bad_action');

		expect(res.status).toBe(400);
		expect(res.body.message).toBe('Forbidden reCAPTCHA action.');
	});
});

@ObjectType()
class Feedback {
	@Field()
	title!: string;
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
		expect(result.action).toBe('Submit');

		return { title };
	}
}

// Apollo runs on the Node adapter through its Express integration; the context gets `req`.
describe('Node adapter (@nestjs/platform-node): GraphQL (Apollo)', () => {
	@Module({ providers: [FeedbackResolver] })
	class TestModule {}

	const api = new MockedRecaptchaApi();
	let app: INestApplication;

	const mutation = 'mutation { submitFeedback(title: "TEST") { title } }';

	beforeAll(async () => {
		app = await createApp(
			{
				imports: [
					TestModule,
					GraphQLModule.forRoot<ApolloDriverConfig>({
						driver: ApolloDriver,
						include: [TestModule],
						autoSchemaFile: true,
						playground: false,
					}),
				],
			},
			api
		);
	});

	afterAll(() => app.close());

	test('Valid token: mutation resolves, @RecaptchaResult() receives the result', async () => {
		api.addResponse('node_gql_ok', v3Response('Submit'));

		const res = await request(app.getHttpServer()).post('/graphql').set('recaptcha', 'node_gql_ok').send({ query: mutation });

		expect(res.body).toEqual({ data: { submitFeedback: { title: 'TEST' } } });
	});

	test('Low score: mutation fails with GoogleRecaptchaException', async () => {
		api.addResponse('node_gql_low_score', v3Response('Submit', 0.1));

		const res = await request(app.getHttpServer()).post('/graphql').set('recaptcha', 'node_gql_low_score').send({ query: mutation });

		expect(res.body.data).toBeNull();
		expect(res.body.errors[0].message).toBe('Low reCAPTCHA score.');
	});
});

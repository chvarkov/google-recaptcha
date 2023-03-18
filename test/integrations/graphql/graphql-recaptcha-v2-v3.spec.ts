import { INestApplication, Module } from '@nestjs/common';
import { GoogleRecaptchaModule, Recaptcha, RecaptchaResult, RecaptchaVerificationResult } from '../../../src';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { MockedRecaptchaApi } from '../../utils/mocked-recaptcha-api';
import { VerifyResponseV3 } from '../../../src/interfaces/verify-response';
import { TestHttp } from '../../utils/test-http';
import { IncomingMessage } from 'http';
import { Args, Field, GraphQLModule, InputType, Mutation, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import * as path from 'path';
import { RECAPTCHA_AXIOS_INSTANCE } from '../../../src/provider.declarations';

@InputType()
export class FeedbackInput {
	@Field({ nullable: false })
	title: string;
}

@ObjectType()
export class Feedback {
	@Field({ nullable: false })
	title: string;
}

@Resolver(() => Feedback)
export class FeedbackResolver {
	@Query(() => String)
	sayHello(@Args('name') name: string): string {
		return `Hi, ${name}`;
	}

	@Recaptcha()
	@Mutation(() => Feedback)
	submitFeedback(@Args('title') title: string, @RecaptchaResult() result: RecaptchaVerificationResult): Feedback {
		expect(result).toBeInstanceOf(RecaptchaVerificationResult);
		expect(result.success).toBeTruthy();

		expect(result.getResponse()).toBeDefined();

		const riskAnalytics = result.getEnterpriseRiskAnalytics();

		expect(riskAnalytics).toBeNull();

		return {
			title,
		};
	}
}

@Module({
	providers: [FeedbackResolver],
})
class TestModule {}

describe('HTTP Recaptcha V2 V3', () => {
	const mockedRecaptchaApi = new MockedRecaptchaApi();

	let http: TestHttp;

	let module: TestingModule;
	let app: INestApplication;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				TestModule,
				GraphQLModule.forRoot<ApolloDriverConfig>({
					include: [TestModule],
					debug: false,
					playground: false,
					driver: ApolloDriver,
					autoSchemaFile: path.join(__dirname, 'schema.gql'),
				}),
				GoogleRecaptchaModule.forRoot({
					debug: true,
					response: (req: IncomingMessage): string => req.headers.recaptcha?.toString(),
					secretKey: 'secret_key',
					score: (score: number) => score >= 0.6,
					actions: ['Submit'],
				}),
			],
		})
			.overrideProvider(RECAPTCHA_AXIOS_INSTANCE)
			.useFactory({
				factory: () => mockedRecaptchaApi.getAxios(),
			})
			.compile();

		app = module.createNestApplication();

		await app.init();

		http = new TestHttp(app.getHttpServer());
	});

	afterAll(() => app.close());

	test('V3 OK', async () => {
		const mutation = () => `
          mutation submitFeedback($title: String!) {
            submitFeedback(title: $title) {
              title
            }
          }`;

		mockedRecaptchaApi.addResponse<VerifyResponseV3>('test_graphql_v3_ok', {
			success: true,
			hostname: 'hostname',
			challenge_ts: new Date().toISOString(),
			action: 'Submit',
			score: 0.9,
			errors: [],
		});

		const title = 'TEST';

		const res: request.Response = await http.post(
			'/graphql',
			{
				query: mutation(),
				variables: {
					title,
				},
			},
			{
				headers: {
					Recaptcha: 'test_graphql_v3_ok',
				},
			}
		);

		expect(res.statusCode).toBe(200);

		expect(res.body.data.submitFeedback.title).toBe(title);
	});
});

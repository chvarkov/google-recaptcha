import { ExecutionContext } from '@nestjs/common';
import { loadModule } from './load-module.js';
import { RecaptchaContextType } from '../types.js';

/** Request object of any platform (express, fastify, ...). The guard stores the verification result on it. */
export type RecaptchaRequest = Record<string, unknown>;

/** The part of `@nestjs/graphql` used here. Declared locally: the package is an optional dependency. */
interface GraphqlModule {
	GqlExecutionContext: {
		create(context: ExecutionContext): {
			getContext(): { req?: RecaptchaRequest; request?: RecaptchaRequest; reply?: { request?: RecaptchaRequest } } | undefined;
		};
	};
}

function resolveGraphqlRequest(context: ExecutionContext): RecaptchaRequest {
	const gqlContext = loadModule<GraphqlModule>('@nestjs/graphql', true).GqlExecutionContext.create(context).getContext();

	const request = gqlContext?.req ?? gqlContext?.request ?? gqlContext?.reply?.request;

	if (!request) {
		throw new Error(
			'Unable to resolve the HTTP request from the GraphQL context. ' +
				'Make sure the request is exposed in the context, e.g. `context: ({ req }) => ({ req })`.'
		);
	}

	return request;
}

export function resolveRequest<T = RecaptchaRequest>(context: ExecutionContext): T {
	const contextType: RecaptchaContextType = context.getType();

	switch (contextType) {
		case 'http':
			return context.switchToHttp().getRequest();

		case 'graphql':
			return resolveGraphqlRequest(context) as T;

		default:
			throw new Error(`Unsupported request type '${contextType}'.`);
	}
}

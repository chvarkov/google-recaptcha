import { ExecutionContext } from '@nestjs/common';
import { loadModule } from './load-module';
import { RecaptchaContextType } from '../types';
import { LiteralObject } from '../interfaces/literal-object';

function resolveGraphqlRequest(context: ExecutionContext): LiteralObject {
	const gqlContext = loadModule('@nestjs/graphql', true).GqlExecutionContext.create(context).getContext();

	const request = gqlContext?.req ?? gqlContext?.request ?? gqlContext?.reply?.request;

	if (!request) {
		throw new Error(
			'Unable to resolve the HTTP request from the GraphQL context. ' +
				'Make sure the request is exposed in the context, e.g. `context: ({ req }) => ({ req })`.'
		);
	}

	return request;
}

export function resolveRequest<T = LiteralObject>(context: ExecutionContext): T {
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

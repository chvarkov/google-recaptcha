import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { resolveRequest } from '../src/helpers/resolve-request';
import { createExecutionContext } from './helpers/create-execution-context';

function createGqlContext(gqlContext: unknown): ExecutionContext {
	vi.spyOn(GqlExecutionContext, 'create').mockReturnValue({ getContext: () => gqlContext } as unknown as GqlExecutionContext);
	return createExecutionContext(() => null, null, 'graphql');
}

describe('resolveRequest', () => {
	afterEach(() => vi.restoreAllMocks());

	test('http', () => {
		const req = { headers: {} };
		expect(resolveRequest(createExecutionContext(() => null, req, 'http'))).toBe(req);
	});

	test('graphql: apollo { req }', () => {
		const req = { headers: {} };
		expect(resolveRequest(createGqlContext({ req }))).toBe(req);
	});

	test('graphql: { request }', () => {
		const request = { headers: {} };
		expect(resolveRequest(createGqlContext({ request }))).toBe(request);
	});

	test('graphql: mercurius { reply }', () => {
		const request = { headers: {} };
		expect(resolveRequest(createGqlContext({ reply: { request } }))).toBe(request);
	});

	test('graphql: request is missing', () => {
		expect(() => resolveRequest(createGqlContext({}))).toThrow('Unable to resolve HTTP request from GraphQL context');
	});

	test('graphql: context is missing', () => {
		expect(() => resolveRequest(createGqlContext(undefined))).toThrow('Unable to resolve HTTP request from GraphQL context');
	});

	test('unsupported', () => {
		expect(() => resolveRequest(createExecutionContext(() => null, null, 'rpc'))).toThrow("Unsupported request type 'rpc'");
	});
});

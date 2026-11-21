import { ContextType, ExecutionContext, Type } from '@nestjs/common';
import { Request } from 'express';

type HttpArgumentsHost = ReturnType<ExecutionContext['switchToHttp']>;
type RpcArgumentsHost = ReturnType<ExecutionContext['switchToRpc']>;
type WsArgumentsHost = ReturnType<ExecutionContext['switchToWs']>;

function createArgumentHost(req: Partial<Request> | null): HttpArgumentsHost {
	return new (class implements HttpArgumentsHost {
		getRequest<T>(): T {
			return req as T;
		}

		getNext<T>(): T {
			console.error("Method 'getNext' doesn't implemented");
			return undefined as never;
		}

		getResponse<T>(): T {
			console.error("Method 'getResponse' doesn't implemented");
			return undefined as never;
		}
	})();
}

export function createExecutionContext(
	handler: () => void,
	req: Partial<Request> | null,
	type: string = 'http',
	classRef: Type = class {}
): ExecutionContext {
	return new (class implements ExecutionContext {
		getHandler(): () => void {
			return handler;
		}

		switchToHttp(): HttpArgumentsHost {
			return createArgumentHost(req);
		}

		getArgByIndex<T>(index: number): T {
			console.error(`Method 'getArgByIndex(${index})' doesn't implemented`);
			return undefined as never;
		}

		getArgs<T = []>(): T {
			console.error("Method 'getArgs' doesn't implemented");
			return undefined as never;
		}

		getClass<T>(): Type<T> {
			return classRef as Type<T>;
		}

		getType<TContext = ContextType>(): TContext {
			return type as unknown as TContext;
		}

		switchToRpc(): RpcArgumentsHost {
			console.error("Method 'switchToRpc' doesn't implemented");
			return undefined as never;
		}

		switchToWs(): WsArgumentsHost {
			console.error("Method 'switchToWs' doesn't implemented");
			return undefined as never;
		}
	})();
}

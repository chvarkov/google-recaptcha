import { ContextType, ExecutionContext, Type } from '@nestjs/common';
import { Request } from 'express';

type HttpArgumentsHost = ReturnType<ExecutionContext['switchToHttp']>;
type RpcArgumentsHost = ReturnType<ExecutionContext['switchToRpc']>;
type WsArgumentsHost = ReturnType<ExecutionContext['switchToWs']>;

function createArgumentHost(req: Partial<Request>): HttpArgumentsHost {
	return new (class implements HttpArgumentsHost {
		getRequest<T>(): T {
			return req as T;
		}

		getNext<T>(): T {
			console.error("Method 'getNext' doesn't implemented");
			return undefined;
		}

		getResponse<T>(): T {
			console.error("Method 'getResponse' doesn't implemented");
			return undefined;
		}
	})();
}

export function createExecutionContext(
	handler: () => void,
	req: Partial<Request>,
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
			return undefined;
		}

		getArgs<T = []>(): T {
			console.error("Method 'getArgs' doesn't implemented");
			return undefined;
		}

		getClass<T>(): Type<T> {
			return classRef as Type<T>;
		}

		getType<TContext = ContextType>(): TContext {
			return type as unknown as TContext;
		}

		switchToRpc(): RpcArgumentsHost {
			console.error("Method 'switchToRpc' doesn't implemented");
			return undefined;
		}

		switchToWs(): WsArgumentsHost {
			console.error("Method 'switchToWs' doesn't implemented");
			return undefined;
		}
	})();
}

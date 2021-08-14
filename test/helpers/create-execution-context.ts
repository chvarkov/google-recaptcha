import { ContextType, ExecutionContext, Type } from '@nestjs/common';
import { HttpArgumentsHost, RpcArgumentsHost, WsArgumentsHost } from '@nestjs/common/interfaces';
import { Request } from 'express';

function createArgumentHost(req: Partial<Request>): HttpArgumentsHost {
    return new class implements HttpArgumentsHost {
        getRequest<T = any>(): T {
            return req as T;
        }

        getNext<T = any>(): T {
            console.error('Method \'getNext\' doesn\'t implemented');
            return undefined;
        }


        getResponse<T = any>(): T {
            console.error('Method \'getResponse\' doesn\'t implemented');
            return undefined;
        }
    }
}

export function createExecutionContext(handler: Function, req: Partial<Request>): ExecutionContext {
    return new class implements ExecutionContext {
        getHandler(): Function {
            return handler;
        }

        switchToHttp(): HttpArgumentsHost {
            return createArgumentHost(req);
        }

        getArgByIndex<T = any>(index: number): T {
            console.error('Method \'getArgByIndex\' doesn\'t implemented');
            return undefined;
        }

        getArgs<T = any[]>(): T {
            console.error('Method \'getArgs\' doesn\'t implemented');
            return undefined;
        }

        getClass<T = any>(): Type<T> {
            console.error('Method \'getClass\' doesn\'t implemented');
            return undefined;
        }

        getType<TContext = ContextType>(): TContext {
            return 'http' as any;
        }

        switchToRpc(): RpcArgumentsHost {
            console.error('Method \'switchToRpc\' doesn\'t implemented');
            return undefined;
        }

        switchToWs(): WsArgumentsHost {
            console.error('Method \'switchToWs\' doesn\'t implemented');
            return undefined;
        }
    }
}

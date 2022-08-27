import { LiteralObject } from '@nestjs/common';
import { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { HttpService } from '@nestjs/axios';
import { Observable, of, throwError } from 'rxjs';
import * as qs from 'qs';

export class MockedRecaptchaApi {
    private readonly responseMap: Map<string, LiteralObject> = new Map<string, LiteralObject>();
    private readonly errorMap: Map<string, LiteralObject> = new Map<string, {statusCode?: number, code?: string, payload?: LiteralObject}>();

    getHttpService(): HttpService {
        const responseMap = this.responseMap;
        const errorMap = this.errorMap;
        return Object.assign(new HttpService(), {
            post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Observable<AxiosResponse<T>> {

                const resolveFn = (d: any) => d?.['response'] || d?.['event']?.token || null;

                const token = typeof data === 'string' ? resolveFn(qs.parse(data)) : resolveFn(data);

                const response = responseMap.get(token);

                if (response) {
                    const res: AxiosResponse = {
                        data: response,
                        status: 200,
                        config: {},
                        request: {},
                        headers: {},
                        statusText: 'OK',
                    };
                    return of(res);
                }

                const errData = errorMap.get(token);

                if (errData) {
                    const err: AxiosError = {
                        response: {
                            data: errData.payload,
                            config: {},
                            headers: {},
                            request: {},
                            status: errData.statusCode,
                            statusText: 'Request was failed',
                        },
                        status: errData.statusCode,
                        config: {},
                        request: data,
                        message: 'Request was failed',
                        isAxiosError: true,
                        stack: new Error().stack,
                        name: 'AxiosError',
                        code: errData.code,
                        toJSON: () => ({}),
                    };

                    return throwError(err);
                }

                expect(errData).toBeDefined();

            }
        });
    }

    addResponse<T = LiteralObject>(token: string, payload: T): this {
        this.responseMap.set(token, payload);

        return this;
    }

    addError<T = LiteralObject>(token: string, options: {statusCode?: number, payload?: T, code?: string}): this {
        this.errorMap.set(token, options);

        return this;
    }
}

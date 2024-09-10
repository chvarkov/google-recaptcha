import { LiteralObject } from '../../src/interfaces/literal-object';
import axios from 'axios';
import { AxiosRequestConfig, AxiosResponse, AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import * as qs from 'qs';

export class MockedRecaptchaApi {
	private readonly responseMap: Map<string, LiteralObject> = new Map<string, LiteralObject>();
	private readonly networkErrorMap: Map<string, string> = new Map<string, string>();
	private readonly errorMap: Map<string, LiteralObject> = new Map<
		string,
		{ statusCode?: number; code?: string; payload?: LiteralObject }
	>();

	getAxios(): AxiosInstance {
		const responseMap = this.responseMap;
		const networkErrorMap = this.networkErrorMap;
		const errorMap = this.errorMap;
		const instance = axios.create({});
		return Object.assign(instance, {
			post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
				const resolveFn = (d: any) => d?.['response'] || d?.['event']?.token || null;

				const token = typeof data === 'string' ? resolveFn(qs.parse(data)) : resolveFn(data);

				const response = responseMap.get(token);

				if (response) {
					const res: AxiosResponse = {
						data: response,
						status: 200,
						config: {} as InternalAxiosRequestConfig,
						request: {},
						headers: {},
						statusText: 'OK',
					};
					return Promise.resolve(res);
				}

				const networkError = networkErrorMap.get(token);

				if (networkError) {
					const err: AxiosError = {
						request: data,
						message: 'Request was failed',
						isAxiosError: true,
						stack: new Error().stack,
						name: 'AxiosError',
						code: networkError,
						toJSON: () => ({}),
					};

					return Promise.reject(err);
				}

				const errData = errorMap.get(token);

				if (errData) {
					const err: AxiosError = {
						response: {
							data: errData.payload,
							headers: {},
							request: {},
							config: {} as InternalAxiosRequestConfig,
							status: errData.statusCode,
							statusText: 'Request was failed',
						},
						status: errData.statusCode,
						request: data,
						message: 'Request was failed',
						isAxiosError: true,
						stack: new Error().stack,
						name: 'AxiosError',
						code: errData.code,
						toJSON: () => ({}),
					};

					return Promise.reject(err);
				}

				expect(errData).toBeDefined();
			},
		});
	}

	addResponse<T = LiteralObject>(token: string, payload: T): this {
		this.responseMap.set(token, payload);

		return this;
	}

	addError<T = LiteralObject>(token: string, options: { statusCode?: number; payload?: T; code?: string }): this {
		this.errorMap.set(token, options);

		return this;
	}

	addNetworkError(token: string, errorCode: string): this {
		this.networkErrorMap.set(token, errorCode);

		return this;
	}
}

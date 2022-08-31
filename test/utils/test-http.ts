import * as request from 'supertest';
import { LiteralObject } from '@nestjs/common';

export interface ITestHttpRequestOptions {
	responseType?: 'stream' | 'json' | 'blob';
	query?: LiteralObject;
	headers?: LiteralObject;
}

export class TestHttp {
	constructor(private readonly httpServer: unknown) {}

	get(url: string, options?: ITestHttpRequestOptions): Promise<request.Response> {
		return new Promise((resolve, reject) =>
			this.addRequestOptions(request(this.httpServer).get(url), options).end((err, res) => (err ? reject(err) : resolve(res)))
		);
	}

	post(url: string, body?: string | object, options?: ITestHttpRequestOptions): Promise<request.Response> {
		return new Promise((resolve, reject) =>
			this.addRequestOptions(request(this.httpServer).post(url), options)
				.send(body)
				.end((err, res) => (err ? reject(err) : resolve(res)))
		);
	}

	patch(url: string, body?: string | object, options?: ITestHttpRequestOptions): Promise<request.Response> {
		return new Promise((resolve, reject) =>
			this.addRequestOptions(request(this.httpServer).patch(url), options)
				.send(body)
				.end((err, res) => (err ? reject(err) : resolve(res)))
		);
	}

	delete(url: string, options?: ITestHttpRequestOptions): Promise<request.Response> {
		return new Promise((resolve, reject) =>
			this.addRequestOptions(request(this.httpServer).delete(url), options).end((err, res) => (err ? reject(err) : resolve(res)))
		);
	}

	private addRequestOptions(req: request.Test, options?: ITestHttpRequestOptions): request.Test {
		if (options?.query) {
			req.query(options?.query);
		}

		if (options?.headers) {
			for (const header of Object.keys(options.headers)) {
				req.set(header, options.headers[header]);
			}
		}

		if (options?.responseType) {
			req.responseType(options?.responseType);
		}

		return req;
	}
}

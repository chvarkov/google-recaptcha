import * as axios from 'axios';
import { LiteralObject } from '../interfaces/literal-object';

export function isAxiosError<T = LiteralObject>(error: unknown): error is axios.AxiosError<T> {
	return !!(error as axios.AxiosError | undefined)?.isAxiosError;
}

export function getErrorInfo(error: unknown): string | LiteralObject {
	if (isAxiosError(error)) {
		return error.response?.data || error.code || 'Unknown axios error';
	}

	const { name, message, stack } = error as Error;

	return { error: name, message, stack };
}

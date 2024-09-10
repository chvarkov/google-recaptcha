import * as axios from 'axios';
import { LiteralObject } from '../interfaces/literal-object';

export function isAxiosError<T = LiteralObject>(error: Error | axios.AxiosError<T>): error is axios.AxiosError<T> {
	return (<axios.AxiosError>error).isAxiosError;
}

export function getErrorInfo(error: Error): string | LiteralObject {
	if (isAxiosError(error)) {
		return error.response?.data || error.code || 'Unknown axios error';
	}

	return { error: error.name, message: error.message, stack: error.stack };
}

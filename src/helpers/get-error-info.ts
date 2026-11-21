import * as axios from 'axios';

export function isAxiosError<T = unknown>(error: unknown): error is axios.AxiosError<T> {
	return !!(error as axios.AxiosError | undefined)?.isAxiosError;
}

/** Short error description for debug logs. */
export function getErrorInfo(error: unknown): unknown {
	if (isAxiosError(error)) {
		return error.response?.data || error.code || 'Unknown axios error';
	}

	const { name, message, stack } = error as Error;

	return { error: name, message, stack };
}

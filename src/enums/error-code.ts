export enum ErrorCode {
	MissingInputSecret = 'missing-input-secret',
	InvalidInputSecret = 'invalid-input-secret',
	MissingInputResponse = 'missing-input-response',
	InvalidInputResponse = 'invalid-input-response',
	BadRequest = 'bad-request',
	TimeoutOrDuplicate = 'timeout-or-duplicate',
	UnknownError = 'unknown-error',
	ForbiddenAction = 'forbidden-action',
	LowScore = 'low-score',
	InvalidKeys = 'invalid-keys',
}

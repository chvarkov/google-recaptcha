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
	IncorrectCaptchaSol = 'incorrect-captcha-sol',
	NetworkError = 'network-error',
	/** `score` / `action` check requested (e.g. `@Recaptcha({ action })`) for reCAPTCHA v2: its response has neither. */
	UnsupportedCheck = 'unsupported-check',
	/** Keys are not set yet: `forRootDeferred()` before `RecaptchaConfigRef.setOptions()`, or after `clear()`. */
	NotConfigured = 'not-configured',
	// enterprise
	SiteMismatch = 'site-mismatch',
	BrowserError = 'browser-error',
}

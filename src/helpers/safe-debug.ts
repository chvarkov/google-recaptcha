import { Logger } from '@nestjs/common';

/**
 * Logging must never affect verification: an exception thrown by a (custom) logger,
 * e.g. on serializing a response, is swallowed instead of failing a valid request.
 */
export function safeDebug(logger: Logger, message: unknown, context: string): void {
	try {
		logger.debug(message, context);
	} catch {
		// Nowhere to report: the logger itself is broken.
	}
}

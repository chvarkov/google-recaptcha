const VISIBLE_CHARS = 3;
const MIN_LENGTH_TO_REVEAL = 12;
const MASK = '******';
const EMPTY = '<empty>';

export function maskSecret(value: string | null | undefined): string {
	if (!value) {
		return EMPTY;
	}

	if (value.length < MIN_LENGTH_TO_REVEAL) {
		return MASK;
	}

	return `${value.slice(0, VISIBLE_CHARS)}${MASK}${value.slice(-VISIBLE_CHARS)}`;
}

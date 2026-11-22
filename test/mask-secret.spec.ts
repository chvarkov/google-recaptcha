import { maskSecret } from '../src/helpers/mask-secret.js';

describe('maskSecret', () => {
	test('Keeps first and last 3 characters', () => {
		expect(maskSecret('6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe')).toBe('6Le******JWe');
	});

	test('Does not reveal length', () => {
		expect(maskSecret('abcdefghijkl')).toBe('abc******jkl');
		expect(maskSecret('abc' + 'x'.repeat(100) + 'xyz')).toBe('abc******xyz');
	});

	test('Fully masks short values', () => {
		expect(maskSecret('abcdefghijk')).toBe('******');
		expect(maskSecret('abc')).toBe('******');
	});

	test('Handles empty values', () => {
		expect(maskSecret('')).toBe('<empty>');
		expect(maskSecret(undefined)).toBe('<empty>');
		expect(maskSecret(null)).toBe('<empty>');
	});
});

import { xor } from '../src/helpers/xor';

describe('xor', () => {
    test('Test', () => {
        expect(xor(true, false)).toBeTruthy();
        expect(xor(false, true)).toBeTruthy();

        expect(xor(true, true)).toBeFalsy();
        expect(xor(false, false)).toBeFalsy();
    });
});

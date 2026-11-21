import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
	{
		ignores: ['dist/**', 'coverage/**', 'test/**', 'node_modules/**'],
	},
	js.configs.recommended,
	...tsPlugin.configs['flat/recommended'],
	{
		files: ['**/*.ts'],
		rules: {
			'no-async-promise-executor': 'off', // Get rid of this
			'@typescript-eslint/explicit-function-return-type': ['error', { allowTypedFunctionExpressions: true }],
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': ['error'],
		},
	},
];

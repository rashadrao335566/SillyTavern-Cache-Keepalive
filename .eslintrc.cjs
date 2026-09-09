module.exports = {
    root: true,
    extends: ['eslint:recommended'],
    env: { browser: true, es2022: true },
    parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    globals: { SillyTavern: 'readonly' },
    plugins: ['jest', 'playwright'],
    overrides: [{ files: ['tests/*.js'], env: { node: true } }],
    rules: {
        'no-unused-vars': ['error', { args: 'none' }],
        'no-constant-condition': ['error', { checkLoops: false }],
    },
};

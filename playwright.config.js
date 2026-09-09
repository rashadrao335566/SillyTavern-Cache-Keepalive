import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    testMatch: '*.e2e.js',
    workers: 2,
    use: { screenshot: 'only-on-failure' },
});

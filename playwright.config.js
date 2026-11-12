import { defineConfig } from '@playwright/test';
export default defineConfig({
 testDir: './tests/e2e', fullyParallel: false, workers: 1,
 reporter: [['list'], ['html', { open: 'never' }]],
 use: { baseURL: 'http://127.0.0.1:5173', channel: process.env.CI ? undefined : 'chrome', headless: true, viewport: { width: 1440, height: 900 }, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
 webServer: { command: 'npm run dev -- --port 5173', url: 'http://127.0.0.1:5173', reuseExistingServer: true },
});

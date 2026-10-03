import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', workers: 1, timeout: 120000, expect: { timeout: 15000 },
  use: { baseURL: process.env.TEST_BASE_URL || 'http://127.0.0.1:4317', viewport: { width: 1600, height: 1000 },
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : { channel: 'chrome' } },
  webServer: process.env.TEST_BASE_URL ? undefined : { command: 'npm run preview -- --host 127.0.0.1 --port 4317 --strictPort', url: 'http://127.0.0.1:4317', reuseExistingServer: false },
});

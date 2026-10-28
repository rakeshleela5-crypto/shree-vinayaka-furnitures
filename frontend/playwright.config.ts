import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Regression Gate for Shree Vinayaka Furnitures ERP & POS
 * Runs against the production Vite preview server (npm run preview on port 4173)
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list']
  ],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run preview -- --port 4173 --host 0.0.0.0',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});

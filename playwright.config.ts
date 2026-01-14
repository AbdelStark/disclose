import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "apps/web/tests/e2e",
  timeout: 120_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  webServer: process.env.PLAYWRIGHT_NO_WEB_SERVER
    ? undefined
    : {
        command: "pnpm dev",
        url: baseURL,
        cwd: "apps/web",
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
        env: {
          ...(process.env as Record<string, string | undefined>),
          NEXT_PUBLIC_BASE_URL: baseURL,
          PORT: "3000"
        } as Record<string, string>
      }
});

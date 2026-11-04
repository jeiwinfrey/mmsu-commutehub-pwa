import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
process.env.CLERK_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  globalSetup: "./tests/global-setup.ts",
  timeout: 60000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3001",
    ...devices["iPhone 13"],
    browserName: "chromium",
    channel: "chrome",
    trace: "retain-on-failure",
  },
  webServer: {
    command: process.env.E2E_BASE_URL
      ? "npm run start -- --port 3002"
      : "npm run dev",
    url: process.env.E2E_BASE_URL || "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});

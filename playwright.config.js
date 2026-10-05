import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45000,
  fullyParallel: false,
  use: { baseURL: "http://localhost:5173", trace: "retain-on-failure" },
  reporter: "list",
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173/health",
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
  },
});

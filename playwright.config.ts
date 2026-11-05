import { defineConfig } from "@playwright/test";

/**
 * The launcher's own gate.
 *
 * Serial and without a web server: it launches the real Electron app, which is
 * the only way to check what it does with a handoff from the operating system.
 * A display is required, so a headless machine wraps this in `xvfb-run`.
 */
export default defineConfig({
  testDir: "./e2e",
  outputDir: "./e2e/test-results",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? "github" : "list",
  use: { trace: "retain-on-failure", screenshot: "only-on-failure" },
});

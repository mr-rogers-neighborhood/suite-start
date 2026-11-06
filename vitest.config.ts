import { defineConfig } from "vitest/config";

/**
 * One project per workspace package. The gate is the whole run: contracts and
 * the file mechanics are pure, so they need no environment beyond Node and no
 * fixture beyond a temp directory.
 */
export default defineConfig({
  resolve: {
    // `development` resolves a workspace package to its `src`, so a test run
    // does not depend on a prior `build`. The condition is declared in each
    // package's `exports`, which is also what lets a consumer pin a dist build.
    conditions: ["development", "import", "default"],
  },
  test: {
    testTimeout: 15_000,
    projects: [
      {
        test: {
          name: "contracts",
          environment: "node",
          include: ["packages/contracts/src/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "files",
          environment: "node",
          include: ["packages/files/src/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "desktop",
          environment: "node",
          include: ["packages/desktop/src/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "start",
          environment: "node",
          include: ["apps/start/src/**/*.test.ts"],
        },
      },
    ],
  },
});

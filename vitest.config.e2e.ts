import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["test/e2e-suite/**/*.test.ts"],
    globalSetup: ["./test/e2e-suite/globalSetup.ts"],
    setupFiles: ["./test/e2e-suite/setupFile.ts"],
    pool: "forks",
    fileParallelism: false,
    testTimeout: 30_000,
    coverage: {
      enabled: false,
    },
  },
});

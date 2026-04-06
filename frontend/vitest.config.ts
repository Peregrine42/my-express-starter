import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["test/suite/**/*.test.ts", "test/suite/**/*.test.tsx"],
    setupFiles: ["./test/setupTests.ts"],
    reporters: ["default", "json"],
    outputFile: {
      json: "reports/frontend.json",
    },
    coverage: {
      provider: "v8",
      include: ["src/pages/**/*.tsx"],
      thresholds: {
        100: true,
      },
    },
  },
});

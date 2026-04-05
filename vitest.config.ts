import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["test/main-suite/**/*.test.ts"],
    setupFiles: ["./test/setupTests.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/migrations/**", "src/index.ts", "src/lib/types.ts"],
    },
  },
});

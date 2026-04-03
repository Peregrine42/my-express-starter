import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["test/suite/**/*.test.ts", "test/suite/**/*.test.tsx"],
    setupFiles: ["./test/setupTests.ts"],
  },
});

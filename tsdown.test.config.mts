import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  outputOptions: {
    exports: "named",
  },
  platform: "node",
  entry: [
    "./test/helpers/**/*.ts",
    "./test/main-suite/**/*.ts",
    "./test/e2e-suite/**/*.ts",
    "./test/setupTests.ts",
  ],
  outDir: "./dist/",
  unbundle: true,
  target: "node24",
  format: "cjs",
  sourcemap: "inline",
  deps: {
    skipNodeModulesBundle: true,
  },
  checks: {
    legacyCjs: false,
  },
});

import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  platform: "node",
  entry: [
    "./test/main-suite/**/*.ts",
    "./test/e2e-suite/**/*.ts",
    "./test/setupTests.mts",
  ],
  outDir: "./dist/",
  unbundle: true,
  target: "node24",
  format: "cjs",
  sourcemap: "inline",
  deps: {
    skipNodeModulesBundle: true,
    onlyAllowBundle: false,
  },
  checks: {
    legacyCjs: false,
  },
});

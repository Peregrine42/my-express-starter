import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  platform: "node",
  entry: [
    "./test/main-suite/**/*.ts",
    "./test/e2e-suite/**/*.ts",
    "./test/setupTests.ts",
  ],
  outDir: "./dist/",
  unbundle: true,
  target: "node24",
  format: "esm",
  sourcemap: "inline",
  deps: {
    skipNodeModulesBundle: true,
    onlyAllowBundle: false,
  },
  checks: {
    legacyCjs: false,
  },
});

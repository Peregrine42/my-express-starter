import { defineConfig } from "tsdown";
import { alwaysBundle } from "./tsdown/alwaysBundle.tsdown.config.cjs";
import { jestGlobals } from "./tsdown/jestGlobals.tsdown.config.cjs";

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
  plugins: [jestGlobals()],
  deps: {
    alwaysBundle: alwaysBundle,
    onlyBundle: false,
  },
  checks: {
    legacyCjs: false,
    pluginTimings: false,
  },
});

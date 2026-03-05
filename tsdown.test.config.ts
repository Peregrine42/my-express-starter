import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  platform: "node",
  entry: ["./test/suite/**/*.ts"],
  outDir: "./dist/",
  unbundle: true,
  target: "node24",
  format: "commonjs",
  sourcemap: "inline",
  deps: {
    skipNodeModulesBundle: true,
    onlyAllowBundle: false,
  },
  checks: {
    legacyCjs: false,
  },
});

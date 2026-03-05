import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  platform: "node",
  entry: ["./test/suite/*.ts", "./test/suite/*.tsx"],
  outDir: "./dist/",
  target: "node24",
  format: ["cjs"],
  checks: {
    legacyCjs: false,
  },
  sourcemap: true,
  env: process.env,
  unbundle: true,
  outputOptions: {
    entryFileNames: "[name].js",
    cssEntryFileNames: "[name].css",
  },
  deps: {
    onlyAllowBundle: false,
    skipNodeModulesBundle: true,
  },
  minify: true,
  treeshake: {
    moduleSideEffects: false,
  },
});

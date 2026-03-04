import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  platform: "node",
  entry: ["./test/suite/*.ts", "./test/suite/*.tsx"],
  outDir: "./dist/",
  target: "node24",
  format: "commonjs",
  sourcemap: true,
  env: process.env,
  deps: {
    alwaysBundle: [/.*/],
    onlyAllowBundle: false,
  },
  minify: true,
  treeshake: {
    moduleSideEffects: false,
  },
});

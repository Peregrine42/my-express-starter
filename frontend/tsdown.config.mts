import dotenv from "dotenv";
dotenv.config();
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./css/**/*.css", "./src/entrypoints/*.tsx"],
  clean: true,
  platform: "browser",
  env: process.env,
  format: "esm",
  outputOptions: {
    entryFileNames: "[name].js",
    cssEntryFileNames: "[name].css",
  },
  sourcemap: true,
  deps: {
    alwaysBundle: [/.*/],
    onlyAllowBundle: false,
  },
  copy: {
    from: "./dist/**/*",
    to: "../public/pages/",
  },
  minify: true,
  treeshake: {
    moduleSideEffects: false,
  },
});

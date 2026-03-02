import dotenv from "dotenv";
dotenv.config();
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/entrypoints/*.tsx"],
  clean: true,
  platform: "browser",
  env: process.env,
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

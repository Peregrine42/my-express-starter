import { defineConfig } from "tsdown";
import { alwaysBundle } from "./tsdown/alwaysBundle.tsdown.config.ts";

export default defineConfig({
  clean: true,
  platform: "node",
  entry: ["./src/index.ts"],
  target: "node24",
  format: "cjs",
  unbundle: true,
  outputOptions: {
    entryFileNames: "src/[name].js",
  },
  deps: {
    alwaysBundle,
  },
  checks: {
    legacyCjs: false,
  },
});

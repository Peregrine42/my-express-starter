import { defineConfig } from "tsdown";
import { alwaysBundle } from "./tsdown/alwaysBundle.tsdown.config.cjs";

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
    onlyBundle: false,
  },
  checks: {
    legacyCjs: false,
    pluginTimings: false,
  },
});

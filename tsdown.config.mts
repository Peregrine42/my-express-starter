import { defineConfig } from "tsdown";

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
    alwaysBundle: [],
  },
  checks: {
    legacyCjs: false,
  },
});

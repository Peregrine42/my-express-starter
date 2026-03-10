import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  platform: "node",
  entry: ["./src/index.ts"],
  target: "node24",
  format: ["esm"],
  unbundle: true,
  outputOptions: {
    entryFileNames: "src/[name].js",
  },
  checks: {
    legacyCjs: false,
  },
});

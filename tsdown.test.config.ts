import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  platform: "node",
  entry: ["./test/suite/*.ts"],
  outDir: "./dist/test",
  target: "node24",
  format: "commonjs",
  sourcemap: true
});

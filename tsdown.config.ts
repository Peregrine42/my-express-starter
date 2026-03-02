import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  platform: "node",
  entry: ["./src/index.ts"],
  target: "node24"
});

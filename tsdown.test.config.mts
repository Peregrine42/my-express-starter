import type { Plugin } from "rolldown";
import { defineConfig } from "tsdown";

/**
 * Rolldown plugin that replaces @jest/globals imports with global references.
 *
 * With `skipNodeModulesBundle: true`, the bundler emits `require("@jest/globals")`
 * for the import. @jest/globals throws if required outside Jest's test env.
 * Jest injects jest, describe, expect, etc. as globals, so we intercept the
 * resolve/load and return references to those globals instead.
 */
function jestGlobals(): Plugin {
  return {
    name: "jest-globals-external",
    resolveId(id) {
      if (id === "@jest/globals") {
        return { id: "@jest/globals", external: true };
      }
    },
    load(id) {
      if (id === "@jest/globals") {
        return `
          export const jest = globalThis.jest;
          export const describe = globalThis.describe;
          export const it = globalThis.it;
          export const expect = globalThis.expect;
          export const beforeEach = globalThis.beforeEach;
          export const afterEach = globalThis.afterEach;
          export const beforeAll = globalThis.beforeAll;
          export const afterAll = globalThis.afterAll;
          export const vi = globalThis.vi;
        `;
      }
    },
  };
}

export default defineConfig({
  clean: true,
  outputOptions: {
    exports: "named",
  },
  platform: "node",
  entry: [
    "./test/helpers/**/*.ts",
    "./test/main-suite/**/*.ts",
    "./test/e2e-suite/**/*.ts",
    "./test/setupTests.ts",
  ],
  outDir: "./dist/",
  unbundle: true,
  target: "node24",
  format: "cjs",
  sourcemap: "inline",
  plugins: [jestGlobals()],
  deps: {
    alwaysBundle: [/p-map/, /tough-cookie/, /axios/],
  },
  checks: {
    legacyCjs: false,
  },
});

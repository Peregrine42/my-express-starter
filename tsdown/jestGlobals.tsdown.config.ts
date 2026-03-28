import type { Plugin } from "rolldown";

/**
 * Rolldown plugin that replaces @jest/globals imports with global references.
 *
 * With `skipNodeModulesBundle: true`, the bundler emits `require("@jest/globals")`
 * for the import. @jest/globals throws if required outside Jest's test env.
 * Jest injects jest, describe, expect, etc. as globals, so we intercept the
 * resolve/load and return references to those globals instead.
 */
export function jestGlobals(): Plugin {
  return {
    name: "jest-globals-external",
    resolveId(id) {
      if (id === "@jest/globals") {
        return { id: "@jest/globals", external: true };
      } else {
        return undefined;
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
      } else {
        return undefined;
      }
    },
  };
}

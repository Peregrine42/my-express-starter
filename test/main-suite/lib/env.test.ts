import { validateEnv } from "../../../src/lib/env";

describe("env", () => {
  it("validates certain env vars are always there", () => {
    expect(() => {return validateEnv(["FOO"] as const);}).toThrow();
  });
});

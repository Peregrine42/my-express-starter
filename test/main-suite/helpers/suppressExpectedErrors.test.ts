import { suppressExpectedErrors } from "../../helpers/suppressExpectedErrors";

describe("suppressExpectedErrors", () => {
  it("passes through unrelated errors to the original console.error", () => {
    const calls: unknown[][] = [];
    const origError = console.error;
    console.error = (...args: unknown[]) => {
      calls.push(args);
    };

    const restore = suppressExpectedErrors(["invalid csrf token"]);

    console.error("Some unexpected error");
    console.error(new Error("something went wrong"));

    restore();
    console.error = origError;

    expect(calls).toHaveLength(2);
    expect(calls[0]![0]).toBe("Some unexpected error");
    expect((calls[1]![0] as Error).message).toBe("something went wrong");
  });

  it("suppresses errors matching a string pattern", () => {
    const calls: unknown[][] = [];
    const origError = console.error;
    console.error = (...args: unknown[]) => {
      calls.push(args);
    };

    const restore = suppressExpectedErrors(["invalid csrf token"]);

    console.error("ForbiddenError: invalid csrf token\n    at some stack");

    restore();
    console.error = origError;

    expect(calls).toHaveLength(0);
  });

  it("suppresses errors matching a regex pattern", () => {
    const calls: unknown[][] = [];
    const origError = console.error;
    console.error = (...args: unknown[]) => {
      calls.push(args);
    };

    const restore = suppressExpectedErrors([/invalid csrf token/i]);

    console.error("ForbiddenError: invalid csrf token\n    at some stack");

    restore();
    console.error = origError;

    expect(calls).toHaveLength(0);
  });

  it("restores the original console.error after cleanup", () => {
    const customFn: typeof console.error = (..._args: unknown[]) => {};
    const origError = console.error;
    console.error = customFn;

    const restore = suppressExpectedErrors(["pattern"]);
    restore();

    expect(console.error).toBe(customFn);
    console.error = origError;
  });
});

import type { MockInstance } from "vitest";

/**
 * Spies on `console.error` to suppress output for errors matching the
 * given patterns. All other errors are passed through to the original
 * `console.error` unchanged.
 *
 * Returns a cleanup function that restores the original `console.error`.
 * Typically used with `beforeEach` / `afterEach`.
 *
 * @example
 * ```ts
 * let restore: () => void;
 * beforeEach(() => {
 *   restore = suppressExpectedErrors(["invalid csrf token"]);
 * });
 * afterEach(() => restore());
 * ```
 */
export function suppressExpectedErrors(
  patterns: Array<string | RegExp>,
): () => void {
  const originalError = console.error;
  const spy: MockInstance = vi
    .spyOn(console, "error")
    .mockImplementation((...args: unknown[]) => {
      const message = args
        .map((a) => {
          return a instanceof Error ? `${a.stack}` : String(a);
        })
        .join("\n");

      const isSuppressed = patterns.some((p) => {
        return typeof p === "string" ? message.includes(p) : p.test(message);
      });

      if (!isSuppressed) {
        originalError(...args);
      }
    });

  return () => {
    spy.mockRestore();
  };
}

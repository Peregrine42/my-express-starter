export interface RecordingEntry {
  /** The property name / method that was called */
  method: string;
  /** The arguments passed to the method */
  args: unknown[];
  /** The return value (or the thrown error) */
  result: unknown;
  /** When the call happened */
  timestamp: number;
}

/**
 * The proxy surface: looks exactly like T (so autocomplete works),
 * plus a `recording` array.
 */
export type RecordedObject<T extends object> = T & {
  readonly recording: RecordingEntry[];
};

export function createRecordingProxy<T extends object>(
  target: T,
): RecordedObject<T> {
  const recording: RecordingEntry[] = [];

  const handler: ProxyHandler<T> = {
    get(_target, prop, receiver) {
      if (prop === "recording") {
        return recording;
      }

      const value = Reflect.get(target, prop, target);

      // Non‑function properties: just forward (headers, statusCode, etc.)
      if (typeof value !== "function") {
        return value;
      }

      // ── Wrap functions so we can record calls ─────────────────────
      return function (this: unknown, ...args: unknown[]) {
        // Always invoke on the *real* target so Express internals work
        const result = value.apply(target, args);

        recording.push({
          method: String(prop),
          args,
          result,
          timestamp: Date.now(),
        });

        // ── Chaining support ──────────────────────────────────────
        // Express methods like res.status(200).json({}) return `this`
        // (i.e. the real res object). We intercept that and return
        // the *proxy* instead so the chained call is also recorded.
        if (result === target) {
          return receiver; // receiver === the proxy
        }

        return result;
      };
    },
  };

  return new Proxy(target, handler) as RecordedObject<T>;
}

// ─── Assertion helpers ─────────────────────────────────

/**
 * Assert that `method` was called on the proxy with args matching
 * `expectedArgs` (positional prefix — you can pass fewer args than the
 * call received).
 *
 * Object args are matched as **subsets**: the actual arg must contain
 * every key from the expected arg, but may have additional keys (e.g.
 * Express merging `res.locals` into render options).
 *
 * Arrays are matched **exactly** (same length, same elements).
 *
 * Throws with a diff on mismatch; returns `true` on match.
 */
export function wasCalledWith<T extends object>(
  proxy: RecordedObject<T>,
  method: keyof T & string,
  ...expectedArgs: unknown[]
): true {
  const match = proxy.recording.some((e) => {
    return (
      e.method === method &&
      e.args.length >= expectedArgs.length &&
      expectedArgs.every((expected, i) => {
        return containsDeep(e.args[i], expected);
      })
    );
  });

  if (match) {
    return true;
  }

  throw new Error(
    `
Recorded object method \`${method}\` was not called with:
${JSON.stringify(expectedArgs, null, 2)}

Got recording:
${JSON.stringify(proxy.recording, null, 2)}
`.trim(),
  );
}

/**
 * Deep subset comparison.
 *
 * - Primitives: strict equality.
 * - Arrays: exact match (same length, same elements).
 * - Plain objects: `expected` must be a **subset** of `actual` — every
 *   key in `expected` must exist in `actual` with a matching value
 *   (checked recursively). Extra keys in `actual` are ignored.
 */
export function containsDeep(actual: unknown, expected: unknown): boolean {
  if (actual === expected) {
    return true;
  }
  if (actual == null || expected == null) {
    return false;
  }
  if (typeof actual !== typeof expected) {
    return false;
  }

  if (Array.isArray(actual)) {
    if (!Array.isArray(expected) || actual.length !== expected.length) {
      return false;
    }

    return actual.every((a, i) => {
      return containsDeep(a, expected[i]);
    });
  }

  if (typeof actual === "object") {
    const expectedObj = expected as Record<string, unknown>;
    const actualObj = actual as Record<string, unknown>;

    return Object.keys(expectedObj).every((key) => {
      return key in actualObj && containsDeep(actualObj[key], expectedObj[key]);
    });
  }

  return false;
}

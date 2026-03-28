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
      if (prop === "recording") {return recording;}

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
export function wasCalledWith<T extends object>(
  proxy: RecordedObject<T>,
  method: keyof T & string,
  ...expectedArgs: unknown[]
): boolean {
  if (
    proxy.recording.some(
      (e) =>
        {return e.method === method &&
        e.args.length === expectedArgs.length &&
        e.args.every((a, i) => {return deepishEqual(a, expectedArgs[i]);});},
    )
  ) {
    return true;
  } else {
    throw new Error(
      `
Recorded object method \`${method}\` was not called with:      
${JSON.stringify(expectedArgs, null, 2)}

Got recording:
${JSON.stringify(proxy.recording, null, 2)}
`.trim(),
    );
  }
}

/** Shallow‑ish equality: handles primitives + one level of object/array */
export function deepishEqual(a: unknown, b: unknown): boolean {
  if (a === b) {return true;}
  if (a == null || b == null) {return false;}
  if (typeof a !== typeof b) {return false;}
  /* istanbul ignore next */
  if (typeof a === "object") {
    return JSON.stringify(a) === JSON.stringify(b);
  } else {
    throw "Unknown comparison!";
  }
}

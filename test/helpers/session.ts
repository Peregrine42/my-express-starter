import { Cookie } from "tough-cookie";
import Redis from "ioredis";
import { setupSession } from "../../src/lib/session";

/**
 * Seed a session in Redis and return headers with a valid cookie string.
 */
export async function seedSession(
  sessionId: string,
  allowedSessionObjectKeys: string[],
): Promise<{ headers: { cookie: string } }> {
  await setupSession(
    { cookies: { session: sessionId } },
    { locals: { allowedSessionObjectKeys } },
    sessionId,
  );

  return {
    headers: {
      cookie: new Cookie({
        value: sessionId,
        key: "session",
        path: "/",
      }).cookieString(),
    },
  };
}

/**
 * Delete all Redis keys for a given session ID
 * (session existence key + any per-field keys like `session:counter:<id>`).
 */
export async function cleanSessionKeys(
  sessionId: string,
  keys: string[] = ["counter"],
): Promise<void> {
  const redis = new Redis({ keyPrefix: "session::" });
  try {
    await redis.del(sessionId);
  } finally {
    redis.disconnect();
  }

  await Promise.all(
    keys.map(async (key) => {
      const r = new Redis({ keyPrefix: `session:${key}:` });
      try {
        await r.del(sessionId);
      } finally {
        r.disconnect();
      }
    }),
  );
}

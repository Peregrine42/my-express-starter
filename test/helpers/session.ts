import pMap from "p-map";
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
 * Seed a session in Redis with a user_id and return the headers.
 */
export async function seedLoggedInSession(
  sessionId: string,
  userId: number,
  allowedSessionObjectKeys: string[] = ["user_id"],
): Promise<{ headers: { cookie: string } }> {
  const { headers } = await seedSession(sessionId, allowedSessionObjectKeys);

  // Write user_id into the session
  const redis = new Redis({ keyPrefix: "session:user_id:" });
  await redis.set(sessionId, String(userId));
  redis.disconnect();

  return { headers };
}

/**
 * Delete all Redis keys for a given session ID
 * (session existence key + any per-field keys like `session:counter:<id>`).
 */
export async function cleanSessionKeys(
  sessionId: string,
  keys: string[] = ["counter", "csrf_token"],
  { concurrency }: { concurrency?: number } = {},
): Promise<void> {
  const allKeys = [
    "",
    ...keys.map((key) => {
      return key;
    }),
  ];
  const keyPrefixes = allKeys.map((key) => {
    return `session:${key}:`;
  });

  await pMap(
    keyPrefixes,
    async (keyPrefix) => {
      const redis = new Redis({ keyPrefix });
      try {
        await redis.del(sessionId);
      } finally {
        redis.disconnect();
      }
    },
    { concurrency },
  );
}

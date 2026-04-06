import Redis from "ioredis";
import {
  setupSession,
  setStringValueFromSession,
  SESSION_TTL_MS,
} from "../../src/lib/session";
import { cleanSessionKeys } from "../helpers/session";

const sessionId = "ttl-test-session";

describe("session TTL", () => {
  const allowedSessionObjectKeys = ["user_id"];

  beforeEach(async () => {
    await cleanSessionKeys(sessionId, ["user_id"]);
  });

  describe("setupSession", () => {
    it("sets a default Redis expiry of 24 hours when ttlMs is not provided", async () => {
      await setupSession(
        { cookies: { session: sessionId } },
        { locals: { allowedSessionObjectKeys } },
        sessionId,
      );

      const redis = new Redis({ keyPrefix: "session::" });
      try {
        const ttl = await redis.ttl(sessionId);
        expect(ttl).toBeGreaterThan(0);
        expect(ttl).toBeLessThanOrEqual(Math.ceil(SESSION_TTL_MS / 1000));
      } finally {
        redis.disconnect();
      }
    });

    it("overrides the default expiry when ttlMs is provided", async () => {
      await setupSession(
        { cookies: { session: sessionId } },
        { locals: { allowedSessionObjectKeys } },
        sessionId,
        60_000, // 1 minute
      );

      const redis = new Redis({ keyPrefix: "session::" });
      try {
        const ttl = await redis.ttl(sessionId);
        expect(ttl).toBeGreaterThan(0);
        expect(ttl).toBeLessThanOrEqual(60);
      } finally {
        redis.disconnect();
      }
    });
  });

  describe("setStringValueFromSession", () => {
    it("sets a default Redis expiry of 24 hours when ttlMs is not provided", async () => {
      await setupSession(
        { cookies: { session: sessionId } },
        { locals: { allowedSessionObjectKeys } },
        sessionId,
      );

      await setStringValueFromSession(
        { cookies: { session: sessionId } },
        { locals: { allowedSessionObjectKeys } },
        "user_id",
        "42",
      );

      const redis = new Redis({ keyPrefix: "session:user_id:" });
      try {
        const ttl = await redis.ttl(sessionId);
        expect(ttl).toBeGreaterThan(0);
        expect(ttl).toBeLessThanOrEqual(Math.ceil(SESSION_TTL_MS / 1000));
      } finally {
        redis.disconnect();
      }
    });

    it("overrides the default expiry when ttlMs is provided", async () => {
      await setupSession(
        { cookies: { session: sessionId } },
        { locals: { allowedSessionObjectKeys } },
        sessionId,
      );

      await setStringValueFromSession(
        { cookies: { session: sessionId } },
        { locals: { allowedSessionObjectKeys } },
        "user_id",
        "42",
        60_000, // 1 minute
      );

      const redis = new Redis({ keyPrefix: "session:user_id:" });
      try {
        const ttl = await redis.ttl(sessionId);
        expect(ttl).toBeGreaterThan(0);
        expect(ttl).toBeLessThanOrEqual(60);
      } finally {
        redis.disconnect();
      }
    });
  });
});

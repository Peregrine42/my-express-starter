import Redis from "ioredis";
import {
  getStringValueFromSession,
  incrementNumericStringValueFromSession,
  decrementNumericStringValueFromSession,
  hasSession,
  SessionReq,
  SessionRes,
  setupSession,
} from "../../../src/lib/session";

const existingSessionId = "session-test-session";
const allowedSessionObjectKeys = ["counter"];

describe("session helpers", () => {
  beforeEach(async () => {
    // Clean up Redis keys used by tests
    const redisCounter = new Redis({ keyPrefix: "session:counter:" });
    try {
      await redisCounter.del(existingSessionId);
    } finally {
      redisCounter.disconnect();
    }

    const redisSession = new Redis({ keyPrefix: "session::" });
    try {
      await redisSession.del(existingSessionId);
    } finally {
      redisSession.disconnect();
    }
  });

  describe("getStringValueFromSession", () => {
    it("throws when the session key is not allowed", async () => {
      const req: SessionReq = { cookies: { session: existingSessionId } };
      const res: SessionRes = {
        locals: { allowedSessionObjectKeys: ["allowed"] },
      };

      await expect(
        getStringValueFromSession(req, res, "disallowed"),
      ).rejects.toThrow("Invalid session object key! 'disallowed'");
    });

    it("returns a stored value for a valid session", async () => {
      await setupSession(
        { cookies: { session: existingSessionId } },
        { locals: { allowedSessionObjectKeys } },
        existingSessionId,
      );

      // Write a value directly to Redis
      const redis = new Redis({ keyPrefix: "session:counter:" });
      try {
        await redis.set(existingSessionId, "42");
      } finally {
        redis.disconnect();
      }

      const req: SessionReq = { cookies: { session: existingSessionId } };
      const res: SessionRes = {
        locals: { allowedSessionObjectKeys },
      };

      const value = await getStringValueFromSession(req, res, "counter");
      expect(value).toEqual("42");
    });

    it("throws when there is no session cookie", async () => {
      const req: SessionReq = {};
      const res: SessionRes = {
        locals: { allowedSessionObjectKeys },
      };

      await expect(
        getStringValueFromSession(req, res, "counter"),
      ).rejects.toThrow("No session!");
    });
  });

  describe("incrementNumericStringValueFromSession", () => {
    it("throws when the session key is not allowed", async () => {
      const req: SessionReq = { cookies: { session: existingSessionId } };
      const res: SessionRes = {
        locals: { allowedSessionObjectKeys: ["allowed"] },
      };

      await expect(
        incrementNumericStringValueFromSession(req, res, "disallowed"),
      ).rejects.toThrow("Invalid session object key! 'disallowed'");
    });

    it("increments a value and returns the result", async () => {
      const req: SessionReq = { cookies: { session: existingSessionId } };
      const res: SessionRes = {
        locals: { allowedSessionObjectKeys },
      };

      const result = await incrementNumericStringValueFromSession(
        req,
        res,
        "counter",
      );
      expect(result).toEqual("1");

      const result2 = await incrementNumericStringValueFromSession(
        req,
        res,
        "counter",
      );
      expect(result2).toEqual("2");
    });

    it("throws when there is no session cookie", async () => {
      const req: SessionReq = {};
      const res: SessionRes = {
        locals: { allowedSessionObjectKeys },
      };

      await expect(
        incrementNumericStringValueFromSession(req, res, "counter"),
      ).rejects.toThrow("No session!");
    });
  });

  describe("decrementNumericStringValueFromSession", () => {
    it("throws when the session key is not allowed", async () => {
      const req: SessionReq = { cookies: { session: existingSessionId } };
      const res: SessionRes = {
        locals: { allowedSessionObjectKeys: ["allowed"] },
      };

      await expect(
        decrementNumericStringValueFromSession(req, res, "disallowed"),
      ).rejects.toThrow("Invalid session object key! 'disallowed'");
    });

    it("decrements a value and returns the result", async () => {
      const req: SessionReq = { cookies: { session: existingSessionId } };
      const res: SessionRes = {
        locals: { allowedSessionObjectKeys },
      };

      const result = await decrementNumericStringValueFromSession(
        req,
        res,
        "counter",
      );
      expect(result).toEqual("-1");

      const result2 = await decrementNumericStringValueFromSession(
        req,
        res,
        "counter",
      );
      expect(result2).toEqual("-2");
    });

    it("throws when there is no session cookie", async () => {
      const req: SessionReq = {};
      const res: SessionRes = {
        locals: { allowedSessionObjectKeys },
      };

      await expect(
        decrementNumericStringValueFromSession(req, res, "counter"),
      ).rejects.toThrow("No session!");
    });
  });

  describe("setupSession", () => {
    it("creates a session with an auto-generated ID when no override is provided", async () => {
      const req: SessionReq = {};
      const res: SessionRes = {
        locals: { allowedSessionObjectKeys },
      };

      const result = await setupSession(req, res);
      expect(result).toEqual(true);
    });
  });

  describe("hasSession", () => {
    it("returns false when there is no session cookie", async () => {
      const req: SessionReq = {};
      const res: SessionRes = {
        locals: { allowedSessionObjectKeys },
      };

      const result = await hasSession(req, res);
      expect(result).toEqual(false);
    });

    it("returns false when the session does not exist in Redis", async () => {
      const req: SessionReq = { cookies: { session: "nonexistent" } };
      const res: SessionRes = {
        locals: { allowedSessionObjectKeys },
      };

      const result = await hasSession(req, res);
      expect(result).toEqual(false);
    });

    it("returns true when the session exists in Redis", async () => {
      await setupSession(
        { cookies: { session: existingSessionId } },
        { locals: { allowedSessionObjectKeys } },
        existingSessionId,
      );

      const req: SessionReq = { cookies: { session: existingSessionId } };
      const res: SessionRes = {
        locals: { allowedSessionObjectKeys },
      };

      const result = await hasSession(req, res);
      expect(result).toEqual(true);
    });
  });
});

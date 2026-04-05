import { Logout } from "../../src/controllers/Logout";
import { wasCalledWith } from "./lib/RecordingProxy";
import { setupMyController } from "../setupMyController";
import { cleanSessionKeys, seedSession } from "../helpers/session";

const existingSessionId = "logout-test-session";
const allowedSessionObjectKeys = ["user_id"];

describe("the Logout controller", () => {
  beforeEach(async () => {
    await cleanSessionKeys(existingSessionId, allowedSessionObjectKeys);
  });

  afterAll(async () => {
    await cleanSessionKeys(existingSessionId, allowedSessionObjectKeys);
  });
  describe("POST", () => {
    it("clears the session cookie and redirects to /login", async () => {
      const [dispatch] = await setupMyController([Logout, "POST"]);
      const { res, response } = await dispatch({ method: "POST" });
      expect(response.statusCode).toEqual(302);
      expect(response.headers.location).toEqual("/login");
      wasCalledWith(res, "clearCookie", "session", { path: "/" });
    });

    it("destroys the session in Redis when a session cookie exists", async () => {
      const { headers } = await seedSession(
        existingSessionId,
        allowedSessionObjectKeys,
      );
      const [dispatch] = await setupMyController([Logout, "POST"]);
      const { response } = await dispatch({ method: "POST", headers });
      expect(response.statusCode).toEqual(302);
      expect(response.headers.location).toEqual("/login");
      // Session should be destroyed — verify it no longer exists
      const Redis = (await import("ioredis")).default;
      const redis = new Redis({ keyPrefix: "session::" });
      try {
        const exists = await redis.exists(existingSessionId);
        expect(exists).toBe(0);
      } finally {
        redis.disconnect();
      }
    });
  });
});

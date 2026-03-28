import { Response } from "light-my-request";
import { SessionCounter } from "../../src/controllers/SessionCounter";
import { wasCalledWith } from "./lib/RecordingProxy";
import {
  getStringValueFromSession,
  SessionReq,
  SessionRes,
} from "../../src/lib/session";
import { setupMyController } from "../setupMyController";
import { cleanSessionKeys, seedSession } from "../helpers/session";

const existingSessionId = "foo";
const allowedSessionObjectKeys = ["counter"];

/**
 * Extract the session ID from a Set-Cookie response header.
 * Asserts the value is a valid UUID.
 */
function extractSessionId(response: Response): string {
  const raw = response.headers["set-cookie"] as string | string[];
  const cookieStr = Array.isArray(raw) ? raw[0] : raw;
  const sessionId = cookieStr.split(";")[0].split("=")[1];
  expect(sessionId).toMatch(/^[0-9a-f-]{36}$/);
  return sessionId;
}

/**
 * Seed a session in Redis then immediately delete it,
 * returning headers that carry a now-stale session cookie.
 */
async function seedStaleSession(sessionId: string, keys: string[]) {
  const { headers } = await seedSession(sessionId, keys);
  await cleanSessionKeys(sessionId);
  return { headers };
}

describe("the counter", () => {
  beforeEach(() => {
    return cleanSessionKeys(existingSessionId);
  });

  describe("with no session cookie", () => {
    it("GET creates a new session and renders counter at 0", async () => {
      // ARRANGE
      const [dispatch] = await setupMyController([SessionCounter, "GET"]);
      // ACT
      const { res, response } = await dispatch();
      // ASSERT
      expect(response.statusCode).toEqual(200);
      wasCalledWith(res, "render", "counter", { value: 0 });
      expect(extractSessionId(response)).toBeDefined();
    });

    it("POST creates a new session and increments the counter", async () => {
      // ARRANGE
      const [dispatch] = await setupMyController([SessionCounter, "POST"]);
      // ACT
      const { res, response } = await dispatch({ method: "POST" });
      // ASSERT
      expect(response.statusCode).toEqual(200);
      wasCalledWith(res, "render", "counter", { value: "1" });
      expect(extractSessionId(response)).toBeDefined();
    });

    it("DELETE creates a new session and decrements the counter", async () => {
      // ARRANGE
      const [dispatch] = await setupMyController([SessionCounter, "DELETE"]);
      // ACT
      const { res, response } = await dispatch({ method: "DELETE" });
      // ASSERT
      expect(response.statusCode).toEqual(200);
      wasCalledWith(res, "render", "counter", { value: "-1" });
      expect(extractSessionId(response)).toBeDefined();
    });
  });

  describe("with a stale session cookie (present in Redis as absent)", () => {
    it("GET creates a new session with a different ID and renders counter at 0", async () => {
      // ARRANGE
      const { headers } = await seedStaleSession(
        existingSessionId,
        allowedSessionObjectKeys,
      );
      const [dispatch] = await setupMyController([SessionCounter, "GET"]);
      // ACT
      const { res, response } = await dispatch({ headers });
      // ASSERT
      expect(response.statusCode).toEqual(200);
      wasCalledWith(res, "render", "counter", { value: 0 });
      expect(extractSessionId(response)).not.toEqual(existingSessionId);
    });

    it("POST creates a new session with a different ID and increments the counter", async () => {
      // ARRANGE
      const { headers } = await seedStaleSession(
        existingSessionId,
        allowedSessionObjectKeys,
      );
      const [dispatch] = await setupMyController([SessionCounter, "POST"]);
      // ACT
      const { res, response } = await dispatch({ method: "POST", headers });
      // ASSERT
      expect(response.statusCode).toEqual(200);
      wasCalledWith(res, "render", "counter", { value: "1" });
      expect(extractSessionId(response)).not.toEqual(existingSessionId);
    });

    it("DELETE creates a new session with a different ID and decrements the counter", async () => {
      // ARRANGE
      const { headers } = await seedStaleSession(
        existingSessionId,
        allowedSessionObjectKeys,
      );
      const [dispatch] = await setupMyController([SessionCounter, "DELETE"]);
      // ACT
      const { res, response } = await dispatch({ method: "DELETE", headers });
      // ASSERT
      expect(response.statusCode).toEqual(200);
      wasCalledWith(res, "render", "counter", { value: "-1" });
      expect(extractSessionId(response)).not.toEqual(existingSessionId);
    });
  });

  it("renders the counter view", async () => {
    // ARRANGE
    const { headers } = await seedSession(
      existingSessionId,
      allowedSessionObjectKeys,
    );
    const [dispatch] = await setupMyController([SessionCounter, "GET"]);
    // ACT
    const { res, response } = await dispatch({ headers });
    // ASSERT
    expect(response.statusCode).toEqual(200);
    wasCalledWith(res, "render", "counter", { value: 0 });
  });

  it("sets the counter to 1 on first POST", async () => {
    // ARRANGE
    const { headers } = await seedSession(
      existingSessionId,
      allowedSessionObjectKeys,
    );
    const [dispatch] = await setupMyController([SessionCounter, "POST"]);
    // ACT
    const { req, res } = await dispatch({ method: "POST", headers });
    // ASSERT
    const val = await getStringValueFromSession(
      req as SessionReq,
      res as SessionRes,
      "counter",
    );
    expect(val).toEqual("1");
  });

  it("accumulates on repeated POSTs", async () => {
    // ARRANGE
    const { headers } = await seedSession(
      existingSessionId,
      allowedSessionObjectKeys,
    );
    const [dispatch] = await setupMyController([SessionCounter, "POST"]);
    // ACT
    await dispatch({ method: "POST", headers });
    const { req, res } = await dispatch({ method: "POST", headers });
    // ASSERT
    const val = await getStringValueFromSession(
      req as SessionReq,
      res as SessionRes,
      "counter",
    );
    expect(val).toEqual("2");
  });

  it("sets the counter to -1 on first DELETE", async () => {
    // ARRANGE
    const { headers } = await seedSession(
      existingSessionId,
      allowedSessionObjectKeys,
    );
    const [dispatch] = await setupMyController([SessionCounter, "DELETE"]);
    // ACT
    const { req, res } = await dispatch({ method: "DELETE", headers });
    // ASSERT
    const val = await getStringValueFromSession(
      req as SessionReq,
      res as SessionRes,
      "counter",
    );
    expect(val).toEqual("-1");
  });

  it("accumulates on repeated DELETEs", async () => {
    // ARRANGE
    const { headers } = await seedSession(
      existingSessionId,
      allowedSessionObjectKeys,
    );
    const [dispatch] = await setupMyController([SessionCounter, "DELETE"]);
    // ACT
    await dispatch({ method: "DELETE", headers });
    const { req, res } = await dispatch({ method: "DELETE", headers });
    // ASSERT
    const val = await getStringValueFromSession(
      req as SessionReq,
      res as SessionRes,
      "counter",
    );
    expect(val).toEqual("-2");
  });
});

import Redis from "ioredis";
import { SessionCounter } from "../../src/controllers/SessionCounter";
import { wasCalledWith } from "./lib/RecordingProxy";
import { setupMyController } from "../setupMyController";
import { cleanSessionKeys, seedSession } from "../helpers/session";
import { getPool } from "../../src/lib/db";

const existingSessionId = "foo";
const allowedSessionObjectKeys = ["user_id"];
const testUsername = "counter-test-user";
let testUserId: number;

/**
 * Seed a session in Redis then immediately delete it,
 * returning headers that carry a now-stale session cookie.
 */
async function seedStaleSession(sessionId: string, keys: string[]) {
  const { headers } = await seedSession(sessionId, keys);
  await cleanSessionKeys(sessionId);
  return { headers };
}

/**
 * Seed a test user in Postgres and return their user ID.
 * Cleans up any existing counter row for that user.
 */
async function seedTestUser(): Promise<number> {
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO users (username) VALUES ($1)
     ON CONFLICT (username) DO NOTHING
     RETURNING id`,
    [testUsername],
  );
  if (result.rows.length > 0) {
    const userId = result.rows[0].id;
    await pool.query(`DELETE FROM counters WHERE user_id = $1`, [userId]);
    return userId;
  }
  const existing = await pool.query(
    `SELECT id FROM users WHERE username = $1`,
    [testUsername],
  );
  const userId = existing.rows[0].id;
  await pool.query(`DELETE FROM counters WHERE user_id = $1`, [userId]);
  return userId;
}

/**
 * Seed a session in Redis with a user_id and return the headers.
 */
async function seedLoggedInSession(
  sessionId: string,
  userId: number,
): Promise<{ headers: { cookie: string } }> {
  const { headers } = await seedSession(sessionId, allowedSessionObjectKeys);

  // Write user_id into the session
  const redis = new Redis({ keyPrefix: "session:user_id:" });
  await redis.set(sessionId, String(userId));
  redis.disconnect();

  return { headers };
}

describe("the counter", () => {
  beforeAll(async () => {
    testUserId = await seedTestUser();
  });

  afterAll(async () => {
    // Clean up test user
    const pool = getPool();
    await pool.query(`DELETE FROM counters WHERE user_id = $1`, [testUserId]);
    await pool.query(`DELETE FROM users WHERE id = $1`, [testUserId]);
  });

  beforeEach(async () => {
    await cleanSessionKeys(existingSessionId, ["user_id"]);
    // Also clean counter in Postgres
    const pool = getPool();
    await pool.query(`DELETE FROM counters WHERE user_id = $1`, [testUserId]);
  });

  describe("with no session cookie", () => {
    it("GET redirects to /login", async () => {
      const [dispatch] = await setupMyController([SessionCounter, "GET"]);
      const { response } = await dispatch();
      expect(response.statusCode).toEqual(302);
      expect(response.headers.location).toEqual("/login");
    });

    it("POST redirects to /login", async () => {
      const [dispatch] = await setupMyController([SessionCounter, "POST"]);
      const { response } = await dispatch({ method: "POST" });
      expect(response.statusCode).toEqual(302);
      expect(response.headers.location).toEqual("/login");
    });

    it("DELETE redirects to /login", async () => {
      const [dispatch] = await setupMyController([SessionCounter, "DELETE"]);
      const { response } = await dispatch({ method: "DELETE" });
      expect(response.statusCode).toEqual(302);
      expect(response.headers.location).toEqual("/login");
    });
  });

  describe("with a stale session cookie (present in Redis as absent)", () => {
    it("GET redirects to /login", async () => {
      const { headers } = await seedStaleSession(
        existingSessionId,
        allowedSessionObjectKeys,
      );
      const [dispatch] = await setupMyController([SessionCounter, "GET"]);
      const { response } = await dispatch({ headers });
      expect(response.statusCode).toEqual(302);
      expect(response.headers.location).toEqual("/login");
    });

    it("POST redirects to /login", async () => {
      const { headers } = await seedStaleSession(
        existingSessionId,
        allowedSessionObjectKeys,
      );
      const [dispatch] = await setupMyController([SessionCounter, "POST"]);
      const { response } = await dispatch({ method: "POST", headers });
      expect(response.statusCode).toEqual(302);
      expect(response.headers.location).toEqual("/login");
    });

    it("DELETE redirects to /login", async () => {
      const { headers } = await seedStaleSession(
        existingSessionId,
        allowedSessionObjectKeys,
      );
      const [dispatch] = await setupMyController([SessionCounter, "DELETE"]);
      const { response } = await dispatch({ method: "DELETE", headers });
      expect(response.statusCode).toEqual(302);
      expect(response.headers.location).toEqual("/login");
    });
  });

  describe("with a logged-in session", () => {
    beforeEach(async () => {
      const { headers: _h } = await seedLoggedInSession(
        existingSessionId,
        testUserId,
      );
    });

    it("renders the counter view at 0", async () => {
      const { headers } = await seedLoggedInSession(
        existingSessionId,
        testUserId,
      );
      const [dispatch] = await setupMyController([SessionCounter, "GET"]);
      const { res, response } = await dispatch({ headers });
      expect(response.statusCode).toEqual(200);
      wasCalledWith(res, "render", "counter", { value: 0 });
    });

    it("increments the counter on POST", async () => {
      const { headers } = await seedLoggedInSession(
        existingSessionId,
        testUserId,
      );
      const [dispatch] = await setupMyController([SessionCounter, "POST"]);
      const { res, response } = await dispatch({ method: "POST", headers });
      expect(response.statusCode).toEqual(200);
      wasCalledWith(res, "render", "counter", { value: 1 });
    });

    it("accumulates on repeated POSTs", async () => {
      const { headers } = await seedLoggedInSession(
        existingSessionId,
        testUserId,
      );
      const [dispatch] = await setupMyController([SessionCounter, "POST"]);
      await dispatch({ method: "POST", headers });
      const { res, response } = await dispatch({ method: "POST", headers });
      expect(response.statusCode).toEqual(200);
      wasCalledWith(res, "render", "counter", { value: 2 });
    });

    it("decrements the counter on DELETE", async () => {
      const { headers } = await seedLoggedInSession(
        existingSessionId,
        testUserId,
      );
      const [dispatch] = await setupMyController([SessionCounter, "DELETE"]);
      const { res, response } = await dispatch({
        method: "DELETE",
        headers,
      });
      expect(response.statusCode).toEqual(200);
      wasCalledWith(res, "render", "counter", { value: -1 });
    });

    it("accumulates on repeated DELETEs", async () => {
      const { headers } = await seedLoggedInSession(
        existingSessionId,
        testUserId,
      );
      const [dispatch] = await setupMyController([SessionCounter, "DELETE"]);
      await dispatch({ method: "DELETE", headers });
      const { res, response } = await dispatch({
        method: "DELETE",
        headers,
      });
      expect(response.statusCode).toEqual(200);
      wasCalledWith(res, "render", "counter", { value: -2 });
    });
  });
});

import { SessionCounter } from "../../src/controllers/SessionCounter";
import { wasCalledWith } from "./lib/RecordingProxy";
import { setupMyController } from "../setupMyController";
import { cleanSessionKeys, seedLoggedInSession } from "../helpers/session";
import { getPool } from "../../src/lib/db";

const existingSessionId = "foo";
const testUsername = "counter-test-user";
let testUserId: number;

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

  describe("with a logged-in session", () => {
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

    it("POST increments the counter and redirects to GET /counter", async () => {
      const { headers } = await seedLoggedInSession(
        existingSessionId,
        testUserId,
      );
      const [postDispatch] = await setupMyController([SessionCounter, "POST"]);
      const { response } = await postDispatch({ method: "POST", headers });
      expect(response.statusCode).toEqual(302);
      expect(response.headers.location).toEqual("/counter");
    });

    it("POST persists the increment, visible on subsequent GET", async () => {
      const { headers } = await seedLoggedInSession(
        existingSessionId,
        testUserId,
      );
      const [postDispatch] = await setupMyController([SessionCounter, "POST"]);
      await postDispatch({ method: "POST", headers });

      const [getDispatch] = await setupMyController([SessionCounter, "GET"]);
      const { res, response } = await getDispatch({ headers });
      expect(response.statusCode).toEqual(200);
      wasCalledWith(res, "render", "counter", { value: 1 });
    });

    it("accumulates on repeated POSTs", async () => {
      const { headers } = await seedLoggedInSession(
        existingSessionId,
        testUserId,
      );
      const [postDispatch] = await setupMyController([SessionCounter, "POST"]);
      await postDispatch({ method: "POST", headers });
      await postDispatch({ method: "POST", headers });

      const [getDispatch] = await setupMyController([SessionCounter, "GET"]);
      const { res, response } = await getDispatch({ headers });
      expect(response.statusCode).toEqual(200);
      wasCalledWith(res, "render", "counter", { value: 2 });
    });

    it("DELETE decrements the counter and redirects to GET /counter", async () => {
      const { headers } = await seedLoggedInSession(
        existingSessionId,
        testUserId,
      );
      const [deleteDispatch] = await setupMyController([
        SessionCounter,
        "DELETE",
      ]);
      const { response } = await deleteDispatch({
        method: "DELETE",
        headers,
      });
      expect(response.statusCode).toEqual(302);
      expect(response.headers.location).toEqual("/counter");
    });

    it("DELETE persists the decrement, visible on subsequent GET", async () => {
      const { headers } = await seedLoggedInSession(
        existingSessionId,
        testUserId,
      );
      const [deleteDispatch] = await setupMyController([
        SessionCounter,
        "DELETE",
      ]);
      await deleteDispatch({ method: "DELETE", headers });

      const [getDispatch] = await setupMyController([SessionCounter, "GET"]);
      const { res, response } = await getDispatch({ headers });
      expect(response.statusCode).toEqual(200);
      wasCalledWith(res, "render", "counter", { value: -1 });
    });

    it("accumulates on repeated DELETEs", async () => {
      const { headers } = await seedLoggedInSession(
        existingSessionId,
        testUserId,
      );
      const [deleteDispatch] = await setupMyController([
        SessionCounter,
        "DELETE",
      ]);
      await deleteDispatch({ method: "DELETE", headers });
      await deleteDispatch({ method: "DELETE", headers });

      const [getDispatch] = await setupMyController([SessionCounter, "GET"]);
      const { res, response } = await getDispatch({ headers });
      expect(response.statusCode).toEqual(200);
      wasCalledWith(res, "render", "counter", { value: -2 });
    });

    it("PUT resets the counter and redirects to GET /counter", async () => {
      const { headers } = await seedLoggedInSession(
        existingSessionId,
        testUserId,
      );
      const [putDispatch] = await setupMyController([SessionCounter, "PUT"]);
      const { response } = await putDispatch({ method: "PUT", headers });
      expect(response.statusCode).toEqual(302);
      expect(response.headers.location).toEqual("/counter");
    });

    it("PUT resets the counter to 0, visible on subsequent GET", async () => {
      const { headers } = await seedLoggedInSession(
        existingSessionId,
        testUserId,
      );

      // Increment first
      const [postDispatch] = await setupMyController([SessionCounter, "POST"]);
      await postDispatch({ method: "POST", headers });
      await postDispatch({ method: "POST", headers });

      // Reset
      const [putDispatch] = await setupMyController([SessionCounter, "PUT"]);
      await putDispatch({ method: "PUT", headers });

      // Should be back to 0
      const [getDispatch] = await setupMyController([SessionCounter, "GET"]);
      const { res, response } = await getDispatch({ headers });
      expect(response.statusCode).toEqual(200);
      wasCalledWith(res, "render", "counter", { value: 0 });
    });
  });
});

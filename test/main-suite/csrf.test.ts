import { getApp } from "../../src/lib/getApp";
import { attachAppMiddleware } from "../../src/lib/attachMiddleware";
import { seedLoggedInSession, cleanSessionKeys } from "../helpers/session";
import { cleanTestUser } from "../helpers/user";
import { getPool } from "../../src/lib/db";
import Redis from "ioredis";
import inject from "light-my-request";

const existingSessionId = "csrf-test-session";
const allowedSessionObjectKeys = ["user_id"];
const testUsername = "csrf-test-user";
let testUserId: number;

async function seedTestUser(): Promise<number> {
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO users (username) VALUES ($1)
     ON CONFLICT (username) DO NOTHING
     RETURNING id`,
    [testUsername],
  );
  if (result.rows.length > 0) {
    return result.rows[0].id;
  }
  const existing = await pool.query(
    `SELECT id FROM users WHERE username = $1`,
    [testUsername],
  );
  return existing.rows[0].id;
}

async function seedCsrfToken(sessionId: string): Promise<string> {
  // Manually write a known CSRF token into Redis
  const csrfToken = "test-csrf-token-12345";
  const redis = new Redis({ keyPrefix: "session:csrf_token:" });
  try {
    await redis.set(sessionId, csrfToken);
  } finally {
    redis.disconnect();
  }
  return csrfToken;
}

describe("CSRF middleware", () => {
  beforeAll(async () => {
    testUserId = await seedTestUser();
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query(`DELETE FROM users WHERE id = $1`, [testUserId]);
  });

  beforeEach(async () => {
    await cleanSessionKeys(existingSessionId, ["user_id", "csrf_token"]);
  });

  it("rejects POST without a CSRF token with 403", async () => {
    const { headers } = await seedLoggedInSession(
      existingSessionId,
      testUserId,
    );
    const [app] = await getApp({});
    await attachAppMiddleware(app);

    const response = await inject(app, {
      method: "POST",
      url: "/counter",
      headers,
      body: "value=1",
      headers: {
        ...headers,
        "content-type": "application/x-www-form-urlencoded",
      },
    });

    expect(response.statusCode).toEqual(403);
  });

  it("allows POST with a valid CSRF token from form body", async () => {
    const { headers } = await seedLoggedInSession(
      existingSessionId,
      testUserId,
    );
    const csrfToken = await seedCsrfToken(existingSessionId);
    const [app] = await getApp({});
    await attachAppMiddleware(app);

    const response = await inject(app, {
      method: "POST",
      url: "/counter",
      headers: {
        ...headers,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: `value=1&_csrf=${csrfToken}`,
    });

    expect(response.statusCode).toEqual(302);
  });

  it("allows POST with a valid CSRF token from header", async () => {
    const { headers } = await seedLoggedInSession(
      existingSessionId,
      testUserId,
    );
    const csrfToken = await seedCsrfToken(existingSessionId);
    const [app] = await getApp({});
    await attachAppMiddleware(app);

    const response = await inject(app, {
      method: "POST",
      url: "/counter",
      headers: {
        ...headers,
        "content-type": "application/x-www-form-urlencoded",
        "x-csrf-token": csrfToken,
      },
      body: "value=1",
    });

    expect(response.statusCode).toEqual(302);
  });

  it("allows GET requests without a CSRF token", async () => {
    const { headers } = await seedLoggedInSession(
      existingSessionId,
      testUserId,
    );
    const [app] = await getApp({});
    await attachAppMiddleware(app);

    const response = await inject(app, {
      method: "GET",
      url: "/counter",
      headers,
    });

    expect(response.statusCode).toEqual(200);
  });
});

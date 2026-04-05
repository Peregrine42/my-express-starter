import { getApp } from "../../src/lib/getApp";
import { attachAppMiddleware } from "../../src/lib/attachMiddleware";
import {
  cleanSessionKeys,
  seedSession,
  seedLoggedInSession,
} from "../helpers/session";
import { getPool } from "../../src/lib/db";
import inject, { type Response as InjectResponse } from "light-my-request";

const existingSessionId = "auth-test-session";
const allowedSessionObjectKeys = ["user_id"];
const testUsername = "auth-test-user";
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

async function seedStaleSession(sessionId: string) {
  const { headers } = await seedSession(sessionId, allowedSessionObjectKeys);
  await cleanSessionKeys(sessionId);
  return { headers };
}

type HttpMethod = "GET" | "POST" | "DELETE" | "PUT";

/**
 * Helper that creates an app with the full router (including auth middleware)
 * and dispatches a request through it.
 */
async function dispatchWithRouter(
  method: HttpMethod,
  path: string,
  options: { headers?: Record<string, string> } = {},
): Promise<{ response: InjectResponse }> {
  const [app] = await getApp({});
  await attachAppMiddleware(app);

  const response = await inject(app, {
    method,
    path,
    ...options,
  });

  return { response };
}

describe("requireAuth middleware", () => {
  beforeAll(async () => {
    testUserId = await seedTestUser();
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query(`DELETE FROM users WHERE id = $1`, [testUserId]);
  });

  beforeEach(async () => {
    await cleanSessionKeys(existingSessionId, ["user_id"]);
  });

  describe("public paths", () => {
    it("allows GET /login without authentication", async () => {
      const { response } = await dispatchWithRouter("GET", "/login");
      expect(response.statusCode).not.toEqual(302);
    });

    it("allows POST /login without authentication", async () => {
      const { response } = await dispatchWithRouter("POST", "/login");
      expect(response.statusCode).not.toEqual(302);
    });
  });

  describe("protected paths", () => {
    it("redirects to /login?redirect= when no session cookie is present", async () => {
      const { response } = await dispatchWithRouter("GET", "/counter");
      expect(response.statusCode).toEqual(302);
      expect(response.headers.location).toEqual("/login?redirect=%2Fcounter");
    });

    it("redirects to /login?redirect= when session cookie is stale", async () => {
      const { headers } = await seedStaleSession(existingSessionId);
      const { response } = await dispatchWithRouter("GET", "/counter", {
        headers,
      });
      expect(response.statusCode).toEqual(302);
      expect(response.headers.location).toEqual("/login?redirect=%2Fcounter");
    });

    it("redirects to /login?redirect= when session exists but has no user_id", async () => {
      const { headers } = await seedSession(
        existingSessionId,
        allowedSessionObjectKeys,
      );
      const { response } = await dispatchWithRouter("GET", "/counter", {
        headers,
      });
      expect(response.statusCode).toEqual(302);
      expect(response.headers.location).toEqual("/login?redirect=%2Fcounter");
    });

    it("allows access when logged in with valid session and user_id", async () => {
      const { headers } = await seedLoggedInSession(
        existingSessionId,
        testUserId,
      );
      const { response } = await dispatchWithRouter("GET", "/counter", {
        headers,
      });
      // Should get 200 (from counter) not 302 (redirect to login)
      expect(response.statusCode).toEqual(200);
    });

    it("redirects GET / to /login?redirect=%2F when not authenticated", async () => {
      const { response } = await dispatchWithRouter("GET", "/");
      expect(response.statusCode).toEqual(302);
      expect(response.headers.location).toEqual("/login?redirect=%2F");
    });

    it("redirects to /login when Redis throws while reading user_id", async () => {
      const { default: session } = await import("../../src/lib/session");
      const { headers } = await seedSession(
        existingSessionId,
        allowedSessionObjectKeys,
      );

      // Temporarily make getStringValueFromSession throw
      const original = session.getStringValueFromSession;
      session.getStringValueFromSession = () => {
        return Promise.reject(new Error("Redis down"));
      };

      try {
        const { response } = await dispatchWithRouter("GET", "/counter", {
          headers,
        });
        expect(response.statusCode).toEqual(302);
        expect(response.headers.location).toEqual("/login?redirect=%2Fcounter");
      } finally {
        session.getStringValueFromSession = original;
      }
    });
  });
});

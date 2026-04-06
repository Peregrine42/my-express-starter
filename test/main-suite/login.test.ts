import { Login } from "../../src/controllers/Login";
import { wasCalledWith } from "./lib/RecordingProxy";
import { setupMyController } from "../setupMyController";
import { cleanSessionKeys, seedSession } from "../helpers/session";
import { cleanTestUser } from "../helpers/user";
import { getPool } from "../../src/lib/db";
import { hashPassword } from "../../src/lib/password";

const existingSessionId = "login-test-session";
const allowedSessionObjectKeys = ["user_id"];
const testUsername = "login-test-user";
const testPassword = "secret123";
let testUserId: number;

async function seedTestUser(): Promise<number> {
  const pool = getPool();
  const passwordHash = await hashPassword(testPassword);
  const result = await pool.query(
    `INSERT INTO users (username, password_hash) VALUES ($1, $2)
     ON CONFLICT (username) DO UPDATE SET password_hash = $2
     RETURNING id`,
    [testUsername, passwordHash],
  );
  return result.rows[0].id;
}

describe("the Login controller", () => {
  beforeAll(async () => {
    testUserId = await seedTestUser();
  });

  afterAll(async () => {
    await cleanTestUser(testUserId);
  });

  beforeEach(async () => {
    await cleanSessionKeys(existingSessionId, allowedSessionObjectKeys);
  });

  describe("GET", () => {
    it("renders the login page", async () => {
      const [dispatch] = await setupMyController([Login, "GET"]);
      const { res, response } = await dispatch();
      expect(response.statusCode).toEqual(200);
      wasCalledWith(res, "render", "login");
    });

    it("reuses existing session if one is valid", async () => {
      const { headers } = await seedSession(
        existingSessionId,
        allowedSessionObjectKeys,
      );
      const [dispatch] = await setupMyController([Login, "GET"]);
      const { res, response } = await dispatch({ headers });
      expect(response.statusCode).toEqual(200);
      wasCalledWith(res, "render", "login");
      // Should NOT have set a new cookie (session already valid)
      const setCookie = response.headers["set-cookie"];
      expect(setCookie).toBeUndefined();
    });
  });

  describe("POST", () => {
    it("redirects to /counter on successful login with correct password", async () => {
      const [dispatch] = await setupMyController([Login, "POST"]);
      const { response } = await dispatch({
        method: "POST",
        body: `username=${testUsername}&password=${testPassword}`,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      });
      expect(response.statusCode).toEqual(302);
      expect(response.headers.location).toEqual("/counter");
    });

    it("redirects to the specified redirect URL on successful login", async () => {
      const [dispatch] = await setupMyController([Login, "POST"]);
      const { response } = await dispatch({
        method: "POST",
        path: "/?redirect=%2Fdashboard",
        body: `username=${testUsername}&password=${testPassword}`,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      });
      expect(response.statusCode).toEqual(302);
      expect(response.headers.location).toEqual("/dashboard");
    });

    it("ignores unsafe redirect URL and falls back to /counter", async () => {
      const [dispatch] = await setupMyController([Login, "POST"]);
      const { response } = await dispatch({
        method: "POST",
        path: "/?redirect=%2F%2Fevil.com",
        body: `username=${testUsername}&password=${testPassword}`,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      });
      expect(response.statusCode).toEqual(302);
      expect(response.headers.location).toEqual("/counter");
    });

    it("renders login with error when username is empty", async () => {
      const [dispatch] = await setupMyController([Login, "POST"]);
      const { response } = await dispatch({
        method: "POST",
        body: "username=&password=test",
        headers: { "content-type": "application/x-www-form-urlencoded" },
      });
      expect(response.statusCode).toEqual(200);
    });

    it("renders login with error and populated username when password is empty", async () => {
      const [dispatch] = await setupMyController([Login, "POST"]);
      const { res, response } = await dispatch({
        method: "POST",
        body: `username=${testUsername}&password=`,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      });
      expect(response.statusCode).toEqual(200);
      wasCalledWith(res, "render", "login", { username: testUsername });
    });

    it("renders login with error and populated username when password is incorrect", async () => {
      const [dispatch] = await setupMyController([Login, "POST"]);
      const { res, response } = await dispatch({
        method: "POST",
        body: `username=${testUsername}&password=wrongpassword`,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      });
      expect(response.statusCode).toEqual(200);
      wasCalledWith(res, "render", "login", { username: testUsername });
    });

    it("renders login with error when username does not exist", async () => {
      const [dispatch] = await setupMyController([Login, "POST"]);
      const { res, response } = await dispatch({
        method: "POST",
        body: "username=nonexistent-user&password=test",
        headers: { "content-type": "application/x-www-form-urlencoded" },
      });
      expect(response.statusCode).toEqual(200);
      wasCalledWith(res, "render", "login", {
        username: "nonexistent-user",
      });
    });

    it("sets a persistent cookie with Max-Age when 'remember' is checked", async () => {
      const [dispatch] = await setupMyController([Login, "POST"]);
      const { response } = await dispatch({
        method: "POST",
        body: `username=${testUsername}&password=${testPassword}&remember=on`,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      });
      expect(response.statusCode).toEqual(302);
      const setCookie = response.headers["set-cookie"] as string;
      expect(setCookie).toBeDefined();
      expect(setCookie.toLowerCase()).toContain("max-age=");
    });

    it("reuses existing session cookie when one exists", async () => {
      const { headers } = await seedSession(
        existingSessionId,
        allowedSessionObjectKeys,
      );
      const [dispatch] = await setupMyController([Login, "POST"]);
      const { response } = await dispatch({
        method: "POST",
        body: `username=${testUsername}&password=${testPassword}`,
        headers: {
          ...headers,
          "content-type": "application/x-www-form-urlencoded",
        },
      });
      expect(response.statusCode).toEqual(302);
      expect(response.headers.location).toEqual("/counter");
    });
  });
});

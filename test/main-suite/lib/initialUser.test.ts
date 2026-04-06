import { getPool } from "../../../src/lib/db";
import { ensureInitialUser } from "../../../src/lib/initialUser";
import { verifyPassword } from "../../../src/lib/password";
import { env } from "../../../src/env";
import { cleanTestUser } from "../../helpers/user";

describe("ensureInitialUser", () => {
  const username = env.INITIAL_USER_USERNAME;
  const password = env.INITIAL_USER_PASSWORD;
  let userId: number | null = null;

  afterAll(async () => {
    if (userId !== null) {
      await cleanTestUser(userId);
    }
  });

  it("creates the user if it does not exist", async () => {
    const pool = getPool();

    // Ensure the user doesn't exist
    await pool.query(`DELETE FROM users WHERE username = $1`, [username]);

    await ensureInitialUser();

    const result = await pool.query(
      `SELECT id, password_hash FROM users WHERE username = $1`,
      [username],
    );
    expect(result.rows).toHaveLength(1);
    userId = result.rows[0].id;

    const isValid = await verifyPassword(
      password,
      result.rows[0].password_hash,
    );
    expect(isValid).toBe(true);
  });

  it("resets the password if the user already exists", async () => {
    const pool = getPool();
    const { hashPassword } = await import("../../../src/lib/password");

    // Set a different password
    const oldHash = await hashPassword("old-wrong-password");
    const existing = await pool.query(
      `UPDATE users SET password_hash = $1 WHERE username = $2 RETURNING id`,
      [oldHash, username],
    );
    userId = existing.rows[0].id;

    // Old password should not work
    const oldValid = await verifyPassword(
      password,
      (
        await pool.query(
          `SELECT password_hash FROM users WHERE username = $1`,
          [username],
        )
      ).rows[0].password_hash,
    );
    expect(oldValid).toBe(false);

    await ensureInitialUser();

    // Password should now be reset to the env var value
    const result = await pool.query(
      `SELECT password_hash FROM users WHERE username = $1`,
      [username],
    );
    const isValid = await verifyPassword(
      password,
      result.rows[0].password_hash,
    );
    expect(isValid).toBe(true);
  });
});

import { getPool } from "./db";
import { hashPassword } from "./password";
import { env } from "../env";

/**
 * Ensure the initial user exists with the credentials from env vars.
 * - If the user does not exist, create it.
 * - If the user exists, reset the password to the env var value.
 */
export async function ensureInitialUser(): Promise<void> {
  const pool = getPool();
  const username = env.INITIAL_USER_USERNAME;
  const passwordHash = await hashPassword(env.INITIAL_USER_PASSWORD);

  const existing = await pool.query(
    `SELECT id FROM users WHERE username = $1`,
    [username],
  );

  if (existing.rows.length > 0) {
    await pool.query(
      `UPDATE users SET password_hash = $1 WHERE username = $2`,
      [passwordHash, username],
    );
  } else {
    await pool.query(
      `INSERT INTO users (username, password_hash) VALUES ($1, $2)`,
      [username, passwordHash],
    );
  }
}

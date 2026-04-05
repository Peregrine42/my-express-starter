import { getPool } from "../../src/lib/db";

/**
 * Delete a test user and any associated counter rows.
 * Use in test teardown to avoid polluting the database.
 */
export async function cleanTestUser(userId: number): Promise<void> {
  const pool = getPool();
  await pool.query(`DELETE FROM counters WHERE user_id = $1`, [userId]);
  await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
}

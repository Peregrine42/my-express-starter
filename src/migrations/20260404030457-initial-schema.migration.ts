import type { MigratorContext } from "./runner";

export async function up({ pool }: MigratorContext) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS counters (
      user_id INTEGER PRIMARY KEY REFERENCES users(id),
      value INTEGER NOT NULL DEFAULT 0
    )
  `);
}

export async function down({ pool }: MigratorContext) {
  await pool.query(`DROP TABLE IF EXISTS counters`);
  await pool.query(`DROP TABLE IF EXISTS users`);
}

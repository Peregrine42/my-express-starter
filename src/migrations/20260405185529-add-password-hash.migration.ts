import type { MigratorContext } from "./runner";

export async function up({ pool }: MigratorContext) {
  await pool.query(`
    ALTER TABLE users ADD COLUMN password_hash TEXT NOT NULL DEFAULT ''
  `);
}

export async function down({ pool }: MigratorContext) {
  await pool.query(`
    ALTER TABLE users DROP COLUMN IF EXISTS password_hash
  `);
}

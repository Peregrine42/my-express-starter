import { Umzug } from "umzug";
import { getPool } from "../lib/db";
import type { Pool } from "pg";

export type MigratorContext = { pool: Pool };

/**
 * Ensure the migrations tracking table exists.
 */
async function ensureMigrationsTable(pool: Pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS umzug_migrations (
      name TEXT PRIMARY KEY
    )
  `);
}

/**
 * Create an Umzug instance configured for our PostgreSQL database.
 * Migrations live in src/migrations/ and use the pg pool as context.
 */
export function createMigrator(pool: Pool = getPool()) {
  return new Umzug<MigratorContext>({
    context: { pool },
    migrations: {
      glob: "src/migrations/*.migration.ts",
      resolve: ({ name, path: migrationPath, context }) => {
        const migration = require(migrationPath!);
        return {
          name,
          up: async () => {
            return migration.up(context);
          },
          down: async () => {
            return migration.down?.(context);
          },
        };
      },
    },
    storage: {
      async executed() {
        await ensureMigrationsTable(pool);
        const result = await pool.query(
          "SELECT name FROM umzug_migrations ORDER BY name",
        );
        return result.rows.map((row: { name: string }) => {
          return row.name;
        });
      },
      async logMigration({ name }) {
        await ensureMigrationsTable(pool);
        await pool.query(
          "INSERT INTO umzug_migrations (name) VALUES ($1) ON CONFLICT DO NOTHING",
          [name],
        );
      },
      async unlogMigration({ name }) {
        await ensureMigrationsTable(pool);
        await pool.query("DELETE FROM umzug_migrations WHERE name = $1", [
          name,
        ]);
      },
    },
    logger: console,
  });
}

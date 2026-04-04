# postgres-counter

**Purpose:** Add Postgres database, user login (username-only, no password), and migrate counter from Redis session to a DB-backed counters table

---

## Commit 9a0009a3 | 2026-04-04T03:27:07.136Z

### Branch Purpose

Add Postgres database, user login (username-only, no password), and migrate counter from Redis session to a DB-backed counters table. Using TypeScript-native migrations via umzug instead of db-migrate.

### Previous Progress Summary

Initial commit.

### This Commit's Contribution

- Replaced db-migrate with umzug for TypeScript-native database migrations, providing better type safety and developer experience
- Migrations now live in `src/migrations/*.migration.ts` with up/down functions that receive a { pool } context
- Migrations are tracked via `umzug_migrations` table in Postgres instead of db-migrate's internal tracking
- Added CLI scripts: `db:up`, `db:down`, `db:status`, `db:create` using tsx to run TypeScript migration scripts
- Fixed umzug storage.executed() to return `string[]` (migration names) instead of objects, which was causing `pending()` to return all migrations as pending
- Maintained full compatibility with existing application code and database schema during migration
- All 70 backend tests pass, ensuring no regressions in controller logic or session management

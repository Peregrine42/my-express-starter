# my-app — Project Roadmap

## Project Purpose

A full-stack web application serving Pug templates with React-bundled frontend assets, backed by Express 5, Redis sessions, and PostgreSQL.

## Current State

- **Routes**: `GET /` (Home), `GET /login`, `POST /login`, `POST /logout`, `GET|POST|DELETE /counter` (SessionCounter — increment/decrement)
- **Database**: PostgreSQL on `localhost:5432` with `users` and `counters` tables; migrations via umzug (`src/migrations/*.migration.ts`), tracked in `umzug_migrations` table
- **Auth**: Password-based login — `Login` controller verifies password via bcrypt for existing users, registers new users with hashed password; stores `user_id` in Redis session; `SessionCounter` redirects to `/login` if no session/user_id
- **Session**: Redis-backed via ioredis; session keys now `["user_id"]` (counter value moved to Postgres)
- **Backend**: Express 5, TypeScript strict mode, `method-override` for DELETE/PUT/PATCH via HTML forms
- **Middleware stack**: cookieParser → sessionSetup → urlencoded body parser → methodOverride → router
- **Frontend**: React 19 bundled with tsdown, output to `public/pages/`
- **Migrations**: umzug with custom Postgres storage; CLI via `db:up`/`db:down`/`db:status`/`db:create` (runs through tsx); auto-runs pending migrations at startup in `beforeAppStartup`
- **Tests**: 95 backend unit tests green (100% coverage); E2E tests updated to seed user in Postgres; frontend tests unchanged
- **Build**: tsdown for both backend (`unbundle: true`, CJS) and frontend (ESM); `pg` and deps in `alwaysBundle` config
- **Linting**: ESLint + Prettier + cspell; no new ignores or suppressions introduced

## Key Decisions Made

- **Express 5** over Express 4 — using latest stable
- **tsdown** as bundler for both backend and frontend
- **Pug** templates extended from a shared layout
- **Redis-backed sessions** with ioredis, key-prefix pattern `session:<key>:<sessionId>`
- **Vitest for testing** (v4) — runs TypeScript directly via Vite's transform pipeline; no pre-build step needed. ESM-only packages handled by Vite's dependency pre-bundling.
- **Controller-base architecture**: routes declared in `getMyRoutes.ts`, controllers extend `BaseController`
- **method-override pattern**: HTML forms POST with `_method` hidden field; function getter `methodOverride((req) => req.body?._method)`
- **Testing non-standard methods**: `setupMyController` dispatches actual HTTP methods directly — don't test the POST→override flow in unit tests
- **E2E globalSetup**: server + browser lifecycle in `test/e2e-suite/globalSetup.ts`; Playwright `chromium.launchServer()`; Vitest `project.provide`/`inject` for WS endpoint
- **Shared middleware setup**: `src/lib/attachMiddleware.ts` with `attachAppMiddleware(app, { withRouter? })`
- **umzug over db-migrate** — TypeScript-native migrations with proper type safety; db-migrate's TS support was poor and required ESLint ignores for generated JS files
- **umzug custom Postgres storage** — `storage.executed()` must return `string[]` (names), not `MigrationMeta[]` objects — umzug creates a Set from the results and checks membership by string name
- **pg bundled via tsdown** — `pg` and its dependencies (`pg-protocol`, `pg-types`, `pg-pool`, etc.) added to `alwaysBundle` config since they contain native addon lookups
- **bcrypt for password hashing** — `src/lib/password.ts` with `hashPassword()` and `verifyPassword()`; SALT_ROUNDS=12; bcrypt added to `alwaysBundle` config
- **Post/Redirect/Get pattern** — POST/DELETE on `/counter` redirect 302 to GET `/counter` instead of rendering inline; prevents browser "confirm form resubmission" warning on refresh

## Milestones

### Completed

- [x] Project scaffolding (Express 5 + TypeScript + Pug + React)
- [x] Session middleware with Redis
- [x] Controller architecture with declarative routing
- [x] Home page and SessionCounter page (increment + decrement)
- [x] Test infrastructure (backend unit, frontend, E2E)
- [x] AGENTS.md and project documentation
- [x] PostgreSQL integration with `pg` pool (`src/lib/db.ts`)
- [x] umzug TypeScript migrations (initial schema: `users` + `counters` tables)
- [x] Password-based login/logout flow (`Login` + `Logout` controllers, `login.pug` with password field)
- [x] Counter migrated from Redis session to Postgres `counters` table, keyed by `user_id`
- [x] Auth guard on `/counter` — redirects to `/login` if no valid session with `user_id`
- [x] All tests updated and passing (95 backend unit, 100% coverage, E2E globalSetup seeds Postgres user)
- [x] Post/Redirect/Get on counter POST/DELETE — prevents browser form resubmission warning on refresh

### Planned

- [ ] Full E2E test run to verify end-to-end login → counter flow

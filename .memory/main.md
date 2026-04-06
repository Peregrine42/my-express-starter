# my-app — Project Roadmap

## Project Purpose

A full-stack web application serving Pug templates with React-bundled frontend assets, backed by Express 5, Redis sessions, and PostgreSQL.

## Current State

- **Routes**: `GET /` (Home), `GET /login`, `POST /login`, `POST /logout`, `GET|POST|DELETE|PUT /counter` (increment/decrement/reset)
- **Database**: PostgreSQL on `localhost:5432` with `users` and `counters` tables; migrations via umzug (`src/migrations/*.migration.ts`), tracked in `umzug_migrations` table; auto-runs pending migrations at startup
- **Auth**: Password-based login with environment-variable-driven initial user (`INITIAL_USER_USERNAME` / `INITIAL_USER_PASSWORD`) via `ensureInitialUser()` at startup; global `requireAuth` middleware in router; stores `user_id` in Redis session; redirects to `/login?redirect=<originalUrl>` for protected routes
- **Security**: CSRF protection via csrf-sync with Redis-backed tokens; session fixation protection (regenerate session ID on login); safe redirect validation
- **Session**: Redis-backed via ioredis; `SESSION_TTL_MS` (24h default), `REMEMBER_ME_TTL_MS` (30 days when "remember me" checked); persistent cookie with `maxAge` vs session-only cookie
- **Middleware stack**: cookieParser → sessionSetup → hasSession (sets `isLoggedIn`) → urlencoded body parser → methodOverride → router (with `requireAuth` guard)
- **Frontend**: React 19 bundled with tsdown, output to `public/pages/`
- **Tests**: 126 tests total (122 backend unit at 100% coverage, 1 frontend, 3 E2E); JSON reports output to `reports/` on every run; `npm run test:report` generates `reports/test-report.md` for review
- **Build**: tsdown for both backend (`unbundle: true`, CJS) and frontend (ESM); `pg`, `bcrypt` and deps in `alwaysBundle` config

## Key Decisions Made

### Architecture

- **Express 5** — latest stable, using async error handling and modern patterns
- **Controller-base architecture**: routes declared in `getMyRoutes.ts`, controllers extend `BaseController`; handled via custom `getRouter.ts` that binds routes and applies `requireAuth` middleware
- **Global auth middleware** (`requireAuth`) over per-controller checks — ensures consistent security; public paths (`GET/POST /login`) bypass auth
- **tsdown** as bundler for both backend and frontend

### Database & Auth

- **umzug** over db-migrate — TypeScript-native migrations with proper type safety
- **umzug custom Postgres storage** — `storage.executed()` must return `string[]` (names), not `MigrationMeta[]` objects
- **bcrypt** for password hashing — SALT_ROUNDS=12; added to `alwaysBundle`
- **Environment-variable initial user** — `ensureInitialUser()` creates or resets user at startup; Login controller only authenticates, never creates
- **Post/Redirect/Get pattern** on counter POST/DELETE — prevents browser form resubmission warning

### Security

- **csrf-sync** with Redis-backed state — chosen over csrf-csrf for robust token generation; `+csrfField` Pug mixin for DRY form protection
- **Session fixation protection** — always regenerate session ID on login, destroy old session data
- **Safe redirect validation** — post-login redirect uses `isSafeRedirect()` to prevent open redirect attacks

### Session & Middleware

- **Redis-backed sessions** with ioredis, key-prefix pattern `session:<key>:<sessionId>`
- **method-override pattern**: function getter `methodOverride((req) => req.body?._method)` — the string form reads from query string, not body
- **Session TTL**: default 24h, extended to 30d when "remember me" checked; cookie `maxAge` set accordingly
- **Shared middleware setup**: `attachAppMiddleware(app, { withRouter? })` in `src/lib/attachMiddleware.ts`

### Testing

- **Vitest v4** — runs TypeScript directly via Vite's transform pipeline; no pre-build step needed
- **light-my-request** for backend HTTP testing — all controllers tested without supertest
- **Playwright** for E2E tests (migrated from Puppeteer)
- **E2E globalSetup**: server + browser lifecycle in `test/e2e-suite/globalSetup.ts`; seeds initial user in Postgres
- **Testing non-standard methods**: `setupMyController` dispatches actual HTTP methods directly — don't test POST→override in unit tests
- **JSON test reports** — each vitest config writes to `reports/*.json`; `scripts/build-test-report.ts` generates markdown summary for reviewing test descriptions

### Dependencies

- **pg bundled via tsdown** — contains native addon lookups that break without bundling
- **bcrypt bundled via tsdown** — same reason

## Milestones

### Completed

- [x] Project scaffolding (Express 5 + TypeScript + Pug + React)
- [x] Session middleware with Redis
- [x] Controller architecture with declarative routing
- [x] Home page and counter page (increment, decrement, reset)
- [x] Test infrastructure (backend unit, frontend, E2E)
- [x] PostgreSQL integration with `pg` pool and umzug migrations
- [x] Password-based login/logout with bcrypt
- [x] Counter migrated from Redis session to Postgres `counters` table
- [x] Global auth middleware (requireAuth)
- [x] CSRF protection (csrf-sync + Redis tokens)
- [x] Session fixation protection
- [x] Post-login safe redirect
- [x] Post/Redirect/Get on counter POST/DELETE
- [x] Environment-variable-driven initial user management
- [x] "Remember me" with persistent cookies and Redis TTL
- [x] 100% backend test coverage
- [x] JSON test reports + markdown summary generation
- [x] AGENTS.md and project documentation

### Planned

- [ ] Review test descriptions for gaps and inconsistencies (using `npm run test:report`)

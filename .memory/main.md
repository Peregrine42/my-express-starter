# my-app — Project Roadmap

## Project Purpose

A full-stack web application serving Pug templates with React-bundled frontend assets, backed by Express 5 and Redis sessions.

## Current State

- Two routes implemented: `GET /` (Home) and `GET|POST|DELETE /counter` (SessionCounter — increment/decrement)
- Backend: Express 5, TypeScript strict mode, Redis sessions via ioredis, `method-override` for DELETE/PUT/PATCH via HTML forms
- Middleware stack: cookieParser → sessionSetup → urlencoded body parser → methodOverride → router
- Frontend: React 19 bundled with tsdown, output to `public/pages/`
- Tests: 66 backend unit tests, 1 frontend test, 2 E2E tests — all green, 100% coverage
- Linting: ESLint + Prettier + cspell
- Build: tsdown for both backend (`unbundle: true`, CJS) and frontend (ESM)
- Test build: tsdown with `unbundle: false`, custom `jestGlobals` plugin, `deps.alwaysBundle` for ESM-only packages
- Test helpers: `test/helpers/session.ts` with `seedSession()` and `cleanSessionKeys()` (uses `p-map` for concurrency control)

## Key Decisions Made

- **Express 5** over Express 4 — using latest stable
- **tsdown** as bundler for both backend and frontend
- **Pug** templates extended from a shared layout
- **Redis-backed sessions** with ioredis, key-prefix pattern `session:<key>:<sessionId>`
- **Separate test build config** (`tsdown.test.config.mts`) for CJS + inline sourcemaps
- **Test build uses `unbundle: false`** with custom `jestGlobals` rolldown plugin (replaces `@jest/globals` imports with `globalThis.*` references) and `deps.alwaysBundle` for ESM-only packages (`p-map`, `tough-cookie`, `axios`). This avoids two incompatibilities: Jest's CJS runtime can't `require()` pure ESM packages, and `@jest/globals` throws if explicitly required outside its test env. `deps.alwaysBundle` and `deps.skipNodeModulesBundle` are mutually exclusive in tsdown, so the plugin approach was needed.
- **`process.cwd()` for static paths in getApp.ts** — `import.meta.dirname` is relative to output file location, which varies between `unbundle: true` (backend build) and `unbundle: false` (test build). `process.cwd()` is always the project root.
- **Controller-base architecture**: routes declared in `getMyRoutes.ts`, controllers extend `BaseController`
- **method-override pattern**: HTML forms POST with `_method` hidden field; use function getter `methodOverride((req) => req.body?._method)` — the string form reads from query string, not body
- **Testing non-standard methods**: `setupMyController` dispatches actual HTTP methods (DELETE, etc.) directly — don't try to test the POST→override flow in unit tests
- **E2E globalSetup**: server + browser lifecycle managed in `test/e2e-suite/globalSetup.ts`, composing jest-puppeteer's browser launch with app startup; session seeded in Redis, cookie set via `page.setCookie()`
- **Shared middleware setup**: `src/lib/attachMiddleware.ts` provides `attachAppMiddleware(app, { withRouter? })` — centralizes session setup, urlencoded parser, method-override, and router attachment. Used by `src/index.ts`, `test/e2e-suite/globalSetup.ts`, and `test/setupMyController.ts` (with `withRouter: false`)

## Milestones

### Completed

- [x] Project scaffolding (Express 5 + TypeScript + Pug + React)
- [x] Session middleware with Redis
- [x] Controller architecture with declarative routing
- [x] Home page and SessionCounter page (increment + decrement)
- [x] Test infrastructure (backend unit, frontend, E2E)
- [x] AGENTS.md and project documentation

### Planned

- (none defined yet)

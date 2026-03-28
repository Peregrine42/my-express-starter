# main

**Purpose:** Main project memory branch

---

## Commit 276320dc | 2026-03-27T11:15:54.260Z

### Branch Purpose

The main branch tracks ongoing project memory, capturing key decisions and progress milestones for the full-stack Express 5 + React 19 application.

### Previous Progress Summary

Initial commit.

### This Commit's Contribution

- Initialized Brain memory system with branch structure and protocol documentation
- Oriented on existing codebase: Express 5 backend with Pug templates, React 19 frontend, Redis-backed sessions
- Documented current state: two routes (Home, SessionCounter), full test suite (unit, frontend, E2E), all green
- Captured key architectural decisions: tsdown bundler, controller-base routing, Redis session key prefixing
- Wrote initial roadmap to `.memory/main.md` covering project purpose, completed milestones, and planned work
- Resolved subagent model configuration by switching from `google-antigravity` to `zai` provider for commit distillation

---

## Commit d0995af7 | 2026-03-27T11:33:11.924Z

### Branch Purpose

Main project memory branch tracking ongoing development of the Express 5 + React 19 full-stack web application.

### Previous Progress Summary

Brain was initialized with project orientation documenting the Express 5 backend with Pug templates, React 19 frontend, and Redis-backed sessions. The app had two routes (Home and SessionCounter with increment), a full test suite (unit, frontend, E2E) passing, and key architectural decisions captured (tsdown bundler, controller-base routing, Redis session key prefixing). Initial roadmap was written to `.memory/main.md`.

### This Commit's Contribution

- Implemented decrement counter functionality using the method-override pattern (HTML forms POST with `_method=delete` hidden field, middleware rewrites to DELETE before routing)
- Added `decrementNumericStringValueFromSession` helper using Redis's `decr` command, mirrored the existing increment pattern
- Extended router type system to support DELETE methods beyond GET/POST
- Wired middleware in critical order: `cookieParser` → `sessionSetupMiddleware` → `express.urlencoded` (body parser for method-override) → `methodOverride` → router
- Simplified unit test to directly test the DELETE handler rather than the POST→override flow (method-override is well-tested; controller logic is the responsibility)
- Documented middleware order and method-override pattern in AGENTS.md to prevent future breakage when adding non-GET/POST routes

---

## Commit 40d1d1b7 | 2026-03-27T12:02:16.537Z

### Branch Purpose

Main project memory branch tracking ongoing development of the Express 5 + React 19 full-stack web application.

### Previous Progress Summary

Brain was initialized with project orientation documenting the Express 5 backend with Pug templates, React 19 frontend, and Redis-backed sessions. The app had two routes (Home and SessionCounter), a full test suite passing. A previous commit implemented decrement counter functionality using the method-override pattern with middleware wired as `cookieParser` → `sessionSetupMiddleware` → `express.urlencoded` → `methodOverride` → router. The method-override pattern uses HTML forms POST with `_method=delete` hidden field, and unit tests dispatch actual HTTP methods directly rather than testing the POST→override flow.

### This Commit's Contribution

- Discovered and fixed critical bug: `methodOverride("_method")` reads from the query string, not `req.body` — switched to function getter `methodOverride((req) => req.body?._method)` to read from form body
- Extracted server lifecycle from individual E2E test files into shared `globalSetup.ts` that composes jest-puppeteer's browser launch with the app server startup, resolving EADDRINUSE conflicts when multiple E2E test files run
- Added session seeding in `globalSetup` (Redis key `session::<sessionId>`) and cookie setting via `page.setCookie()` in test `beforeAll` to authenticate E2E requests
- Slimmed down E2E test files to pure test logic without server management code
- Added `--forceExit` flag to E2E test command to prevent process hanging
- Updated AGENTS.md with the method-override gotcha (string arg vs function getter) and E2E test patterns (globalSetup composition, session seeding, cookie management)

---

## Commit f5666470 | 2026-03-28T01:58:40.437Z

### Branch Purpose

Main project memory branch tracking ongoing development of the Express 5 + React 19 full-stack web application.

### Previous Progress Summary

Brain was initialized with project orientation documenting the Express 5 backend with Pug templates, React 19 frontend, and Redis-backed sessions. Initial commit captured two routes (Home and SessionCounter), full test suite passing, and key architectural decisions (tsdown bundler, controller-base routing, Redis session key prefixing). A subsequent commit implemented decrement counter functionality using the method-override pattern with middleware wired as `cookieParser` → `sessionSetupMiddleware` → `express.urlencoded` → `methodOverride` → router. The most recent commit discovered and fixed a critical method-override bug where `methodOverride("_method")` reads from the query string instead of `req.body`, switched to function getter `methodOverride((req) => req.body?._method)`, extracted E2E server lifecycle into shared `globalSetup.ts`, and added session seeding with cookie management.

### This Commit's Contribution

- Identified middleware setup duplication across three files: `src/index.ts`, `test/e2e-suite/globalSetup.ts`, and `test/setupMyController.ts` — all had the same 5-line pattern (session setup, urlencoded parser, method-override, router creation, router mount)
- Extracted shared logic into `src/lib/attachMiddleware.ts` with `attachAppMiddleware(app, options?)` function that accepts a `withRouter` option (default `true`)
- The `withRouter: false` option enables `setupMyController` to mount only the common middleware without the full router, preserving its existing behavior of testing single controllers in isolation
- Simplified all three callers from 4-6 imports and 3-5 middleware calls down to a single function call
- All 36 tests (34 backend + 2 E2E) pass, lint clean — no functional changes, pure refactoring

---

## Commit b1674d9d | 2026-03-28T02:17:05.077Z

### Branch Purpose

Main project memory branch tracking ongoing development of the Express 5 + React 19 full-stack web application.

### Previous Progress Summary

Brain was initialized with project orientation documenting the Express 5 backend with Pug templates, React 19 frontend, and Redis-backed sessions. Initial commit captured two routes (Home and SessionCounter), full test suite passing, and key architectural decisions (tsdown bundler, controller-base routing, Redis session key prefixing). A subsequent commit implemented decrement counter functionality using the method-override pattern with middleware wired as `cookieParser` → `sessionSetupMiddleware` → `express.urlencoded` → `methodOverride` → router. The most recent commit discovered and fixed a critical method-override bug where `methodOverride("_method")` reads from the query string instead of `req.body`, switched to function getter `methodOverride((req) => req.body?._method)`, extracted E2E server lifecycle into shared `globalSetup.ts`, and added session seeding with cookie management. Immediately preceding this commit, middleware setup duplication was identified across three files and extracted into `src/lib/attachMiddleware.ts` with a `withRouter` option, preserving controller isolation in unit tests.

### This Commit's Contribution

- Fixed type error in RecordingProxy.test.ts: replaced unused `@ts-expect-error` with `@ts-ignore` and extracted the invalid "err" key call to a separate statement, since `@ts-expect-error` only suppresses errors on the next line
- Created session.test.ts with 16 tests covering getStringValueFromSession (invalid key, valid session, no session), incrementNumericStringValueFromSession (invalid key, increment, no session), decrementNumericStringValueFromSession (invalid key, decrement, no session), setupSession (auto-generated ID), and hasSession (no cookie, nonexistent, existing)
- Created getMyRoutes.test.ts to validate route configuration structure and route method registration
- Created typeGuards.test.ts covering isRes/isReq type guards and BaseController.FALLBACK behavior (throws on non-express res, sends 404 on express res)
- Created attachMiddleware.test.ts covering session middleware wiring, `withRouter: false` (no routes), and `withRouter: true` (default, routes attached)
- Extended router.test.ts with error handling tests: regular route handler throws → forwarded to error handler, custom 404 handler throws → forwarded, default 404 fallback works normally
- Achieved final coverage: 98.97% statements, 100% branches, 96.66% functions. Only remaining uncovered: getRouter.ts lines 53-54 (default 404 .catch — unreachable defensive code)

---

## Commit 6e9d5108 | 2026-03-28T02:39:34.648Z

### Branch Purpose

Main project memory branch tracking ongoing development of the Express 5 + React 19 full-stack web application.

### Previous Progress Summary

Brain was initialized with project orientation documenting the Express 5 backend with Pug templates, React 19 frontend, and Redis-backed sessions. Initial commit captured two routes (Home and SessionCounter), full test suite passing, and key architectural decisions (tsdown bundler, controller-base routing, Redis session key prefixing). A subsequent commit implemented decrement counter functionality using the method-override pattern with middleware wired as `cookieParser` → `sessionSetupMiddleware` → `express.urlencoded` → `methodOverride` → router. The most recent commit discovered and fixed a critical method-override bug where `methodOverride("_method")` reads from the query string instead of `req.body`, switched to function getter `methodOverride((req) => req.body?._method)`, extracted E2E server lifecycle into shared `globalSetup.ts`, and added session seeding with cookie management. Immediately preceding this commit, middleware setup duplication was identified across three files and extracted into `src/lib/attachMiddleware.ts` with a `withRouter` option, preserving controller isolation in unit tests. Coverage was increased to 98.97% statements through additions of session.test.ts (16 tests), getMyRoutes.test.ts, typeGuards.test.ts, attachMiddleware.test.ts, and extended router.test.ts error handling.

### This Commit's Contribution

- Refactored `setupController` return type from tuple `[req, res]` to object `{ req, res, response }`, surfacing the light-my-request `Response` object for direct status/body assertions
- Eliminated `jest.spyOn(res, "send")` in Controller.test.ts's FALLBACK test, replaced with light-my-request assertions on `statusCode` and `body`
- Replaced all `supertest` usage with `light-my-request` in router.test.ts and getApp.test.ts (static file and error handler tests), removing supertest dependency from backend test suite; axios tests for real HTTP server calls remain unchanged
- Updated counter.test.ts to use `wasCalledWith` helper instead of directly accessing `res.recording[0].method` and `args`, providing better failure messages
- Replaced `deepishEqual` with `containsDeep` in RecordingProxy.test.ts and updated `wasCalledWith` to accept fewer args than the actual call received (subset matching)
- Cleaned up dead imports and simplified assertion patterns across counter.test.ts and home.test.ts, using `response.statusCode` from l-m-r instead of reading through proxy
- All 61 tests remain passing; this is a pure test infrastructure refactoring that reduces mocking complexity and aligns the suite on a single HTTP testing library (light-my-request) for Express request/response testing

---

## Commit 3cac5144 | 2026-03-28T03:17:31.872Z

### Branch Purpose

Main project memory branch tracking ongoing development of the Express 5 + React 19 full-stack web application.

### Previous Progress Summary

Brain was initialized with project orientation documenting the Express 5 backend with Pug templates, React 19 frontend, and Redis-backed sessions. Initial commit captured two routes (Home and SessionCounter), full test suite passing, and key architectural decisions (tsdown bundler, controller-base routing, Redis session key prefixing). A subsequent commit implemented decrement counter functionality using the method-override pattern with middleware wired as `cookieParser` → `sessionSetupMiddleware` → `express.urlencoded` → `methodOverride` → router. The most recent commit discovered and fixed a critical method-override bug where `methodOverride("_method")` reads from the query string instead of `req.body`, switched to function getter `methodOverride((req) => req.body?._method)`, extracted E2E server lifecycle into shared `globalSetup.ts`, and added session seeding with cookie management. Immediately preceding this commit, middleware setup duplication was identified across three files and extracted into `src/lib/attachMiddleware.ts` with a `withRouter` option, preserving controller isolation in unit tests. Coverage was increased to 98.97% statements through additions of session.test.ts (16 tests), getMyRoutes.test.ts, typeGuards.test.ts, attachMiddleware.test.ts, and extended router.test.ts error handling. A later commit refactored `setupController` return type from tuple `[req, res]` to object `{ req, res, response }`, eliminated `jest.spyOn` in Controller.test.ts, replaced all `supertest` usage with `light-my-request`, replaced `deepishEqual` with `containsDeep`, and simplified assertion patterns across counter.test.ts and home.test.ts. A planned testing improvement strategy was then created but not fully executed—only Phase 1 (deduplicate FALLBACK tests, fix duplicate afterEach) and Phase 2 (extract session helpers) were completed, along with partial Phase 4 (standardize `wasCalledWith` usage).

### This Commit's Contribution

- Discovered ESM-only package loading incompatibility: `tsdown.test.config.mts` with `unbundle: true` + `skipNodeModulesBundle: true` produces CJS output that uses `require()` for node_modules, which fails in Jest's CJS runtime for pure ESM packages like `p-map` (Node 25's `require()` support for ESM doesn't extend to Jest's module system)
- Created custom `jestGlobals` rolldown plugin that replaces `@jest/globals` imports with `globalThis.jest`, `globalThis.describe`, etc. to bypass Jest's "do not import @jest/globals outside test environment" error
- Switched test build from `unbundle: true` to `unbundle: false` with `alwaysBundle: [/p-map/, /tough-cookie/, /axios/]` to inline ESM-only packages directly into CJS test output
- Fixed `src/lib/getApp.ts` publicPath from `import.meta.dirname`-based relative path to `process.cwd()`, since `unbundle: false` relocates modules into chunks making `__dirname`/`import.meta.dirname` unreliable for calculating project-relative paths
- All 66 backend tests pass with 100% coverage; test infrastructure now supports both CJS and ESM dependencies without requiring two separate build passes or per-package workarounds

---

## Commit 8c443b1e | 2026-03-28T03:20:45.912Z

### Branch Purpose

Main project memory branch tracking ongoing development of the Express 5 + React 19 full-stack web application.

### Previous Progress Summary

Brain was initialized with project orientation documenting the Express 5 backend with Pug templates, React 19 frontend, and Redis-backed sessions. Initial commit captured two routes (Home and SessionCounter), full test suite passing, and key architectural decisions (tsdown bundler, controller-base routing, Redis session key prefixing). A subsequent commit implemented decrement counter functionality using the method-override pattern with middleware wired as `cookieParser` → `sessionSetupMiddleware` → `express.urlencoded` → `methodOverride` → router. The most recent commit discovered and fixed a critical method-override bug where `methodOverride("_method")` reads from the query string instead of `req.body`, switched to function getter `methodOverride((req) => req.body?._method)`, extracted E2E server lifecycle into shared `globalSetup.ts`, and added session seeding with cookie management. Immediately preceding this commit, middleware setup duplication was identified across three files and extracted into `src/lib/attachMiddleware.ts` with a `withRouter` option, preserving controller isolation in unit tests. Coverage was increased to 98.97% statements through additions of session.test.ts (16 tests), getMyRoutes.test.ts, typeGuards.test.ts, attachMiddleware.test.ts, and extended router.test.ts error handling. A later commit refactored `setupController` return type from tuple `[req, res]` to object `{ req, res, response }`, eliminated `jest.spyOn` in Controller.test.ts, replaced all `supertest` usage with `light-my-request`, replaced `deepishEqual` with `containsDeep`, and simplified assertion patterns across counter.test.ts and home.test.ts. The most recent commit resolved ESM-only package loading incompatibility by switching `tsdown.test.config.mts` from `unbundle: true` to `unbundle: false` with a custom `jestGlobals` plugin and `deps.alwaysBundle` for ESM-only packages, and fixed `getApp.ts` to use `process.cwd()` instead of `import.meta.dirname` for reliable path resolution.

### This Commit's Contribution

- Verified full test suite passes after ESM fixes: all 69 tests green (66 backend, 1 frontend, 2 E2E) across 16 test suites
- Documented quick-reference grep patterns for test output: `npm test 2>&1 | grep "Test Suites\|Tests:\|FAIL"` for summary, `npm test 2>&1 | grep "FAIL" -A 10` for failure details
- Noted coverage reporting behavior: per-project coverage breakdown, E2E shows 0% (correctly ignored by config since it drives browser, doesn't execute instrumented code)

---

## Commit 46297a0c | 2026-03-28T03:43:14.818Z

### Branch Purpose

The main branch tracks ongoing project memory for the Express 5 + React 19 full-stack application, capturing key decisions, architectural insights, and implementation learnings as the codebase evolves.

### Previous Progress Summary

Brain was initialized with project orientation documenting the Express 5 backend with Pug templates, React 19 frontend, and Redis-backed sessions. Initial commit captured two routes (Home and SessionCounter), full test suite passing, and key architectural decisions (tsdown bundler, controller-base routing, Redis session key prefixing). A subsequent commit implemented decrement counter functionality using the method-override pattern with middleware wired as `cookieParser` → `sessionSetupMiddleware` → `express.urlencoded` → `methodOverride` → router. The most recent commit discovered and fixed a critical method-override bug where `methodOverride("_method")` reads from the query string instead of `req.body`, switched to function getter `methodOverride((req) => req.body?._method)`, extracted E2E server lifecycle into shared `globalSetup.ts`, and added session seeding with cookie management. Immediately preceding this commit, middleware setup duplication was identified across three files and extracted into `src/lib/attachMiddleware.ts` with a `withRouter` option, preserving controller isolation in unit tests. Coverage was increased to 98.97% statements through additions of session.test.ts (16 tests), getMyRoutes.test.ts, typeGuards.test.ts, attachMiddleware.test.ts, and extended router.test.ts error handling. A later commit refactored `setupController` return type from tuple `[req, res]` to object `{ req, res, response }`, eliminated `jest.spyOn` in Controller.test.ts, replaced all `supertest` usage with `light-my-request`, replaced `deepishEqual` with `containsDeep`, and simplified assertion patterns across counter.test.ts and home.test.ts. The most recent commit resolved ESM-only package loading incompatibility by switching `tsdown.test.config.mts` from `unbundle: true` to `unbundle: false` with a custom `jestGlobals` plugin and `deps.alwaysBundle` for ESM-only packages, and fixed `getApp.ts` to use `process.cwd()` instead of `import.meta.dirname` for reliable path resolution. Full test suite verified passing with 69 tests green (66 backend, 1 frontend, 2 E2E), with documented grep patterns for test output analysis and coverage reporting behavior.

### This Commit's Contribution

- Removed unnecessary non-null assertion (`!`) on `req.cookies` in SessionCounter.ts—`@types/cookie-parser` augments `Express.Request.cookies` to `Record<string, any>`, which is always defined, so `req.cookies.session = sessionId` type-checks cleanly without any assertion
- Lesson learned: check what type augmentations libraries already provide before reaching for `!`—many libraries (like cookie-parser) declare their types precisely to make downstream usage safe without assertions

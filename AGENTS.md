# AGENTS.md

## Project Overview

A full-stack web application built with Express 5 (backend) and React (frontend). The backend renders Pug templates and serves them along with React-bundled frontend assets. Session state is managed via Redis. Tests include unit tests (Jest + light-my-request), frontend tests (Jest + React Testing Library), and E2E tests (Jest + Puppeteer).

## Architecture

### Backend (`/src`)

- **Entry point:** `src/index.ts` — bootstraps Express app, validates env vars, registers routes and session middleware.
- **Routing:** Routes are defined declaratively in `src/getMyRoutes.ts` as a `RoutesConfig` map (`"METHOD /path" → [Controller, methodName]`). The `src/lib/getRouter.ts` module converts these into Express router handlers.
- **Controllers:** Extend `BaseController` from `src/lib/Controller.ts`. Override HTTP method handlers (`GET`, `POST`, etc.). Unhandled methods fall through to `FALLBACK` → 404.
- **Session:** Redis-backed sessions via `src/lib/session.ts`. Uses `ioredis` with key prefixes like `session:<key>:<sessionId>`. Controllers declare allowed session keys via `sessionSetupMiddleware` on the app.
- **Environment:** Required env vars (`PORT`, `NODE_ENV`, `REDIS_URL`, `SESSION_SECRET`, `COOKIE_DOMAIN`) are defined in `src/env.ts` and validated at startup. See `.env.example`.

### Frontend (`/frontend`)

- **React 19** app bundled with **tsdown** (browser target, ESM output).
- **Entry points:** `frontend/src/entrypoints/*.tsx` and `frontend/css/*.css`.
- **Pages:** `frontend/src/pages/*.tsx`.
- Built output is copied to `public/pages/` (served as static files by the backend).
- Pug templates in `views/` reference these via `/public/pages/<name>.js` and `/public/pages/base.css`.

### Views (`/views`)

- Pug templates extending `views/layout.pug`. Used by backend controllers via `res.render()`.

## Tech Stack

| Layer      | Technology                            |
| ---------- | ------------------------------------- |
| Runtime    | Node.js 25 (managed via asdf)         |
| Language   | TypeScript (strict mode)              |
| Backend    | Express 5                             |
| Templates  | Pug                                   |
| Frontend   | React 19                              |
| Session/DB | Redis (ioredis)                       |
| Bundler    | tsdown (both backend and frontend)    |
| Linting    | ESLint (typescript-eslint) + Prettier |
| Spelling   | cspell                                |
| Unit Tests | Jest (backend + frontend)             |
| E2E Tests  | Jest + jest-puppeteer                 |

### Middleware Order (`src/index.ts`)

The middleware stack is applied in this specific order — changing it can break functionality:

1. `cookieParser()` — parses cookies (needed by session)
2. `sessionSetupMiddleware()` — sets allowed session keys on `res.locals`
3. `express.urlencoded()` — parses URL-encoded form bodies (needed by method-override)
4. `methodOverride("_method")` — rewrites HTTP methods via `_method` hidden form field
5. Router (`myRouter`) — route handlers

### HTTP Method Override

Browsers only support GET and POST for HTML forms. To support PUT/DELETE/PATCH from forms, the project uses `method-override`. Forms submit as POST with a hidden `<input name="_method" value="delete">` field. The middleware rewrites `req.method` before routing.

**Important:** `method-override("_method")` (string arg) reads from the **query string**, not `req.body`. To read from a form body, use a function getter: `methodOverride((req) => req.body?._method)`. This requires `express.urlencoded()` (or similar body parser) to be mounted first.

**When adding routes for non-GET/POST methods:**

- Register them as DELETE/PUT/PATCH in `getMyRoutes.ts`
- Use forms with `method="post"` and `_method` hidden field in Pug templates
- The `express.urlencoded()` body parser must precede `methodOverride()` in middleware

**Testing note:** The `setupMyController` test helper dispatches specific HTTP methods directly via `light-my-request`. Method-override is a well-tested library — unit tests should test controller handlers with their actual HTTP method, not the POST→override flow.

## Commands

All commands are run from the project root.

| Command                 | Description                                   |
| ----------------------- | --------------------------------------------- |
| `npm run dev`           | Start both frontend and backend in watch mode |
| `npm run build`         | Build both backend and frontend               |
| `npm start`             | Start the built backend server                |
| `npm test`              | Run all tests (backend, frontend, e2e)        |
| `npm run backend:test`  | Build and run backend unit tests              |
| `npm run frontend:test` | Build and run frontend tests                  |
| `npm run test:e2e`      | Build and run E2E tests                       |
| `npm run lint`          | Run Prettier (write) then ESLint              |
| `npm run tsc`           | Type-check only (no emit)                     |

## Code Style

- **Indent:** 2 spaces, LF line endings (see `.editorconfig`)
- **Linter:** ESLint with typescript-eslint. Unused vars allowed if prefixed with `_`.
- **Formatter:** Prettier (runs as part of `npm run lint`)
- **TypeScript:** Strict mode enabled (`strict`, `noImplicitAny`, `strictNullChecks`).
- **Module format:** ESM source, CJS output for backend; ESM for frontend.
- **Imports:** Use `.ts` extensions in imports (`allowImportingTsExtensions: true`).

## Project Structure

```
my-app/
├── src/                    # Backend source
│   ├── index.ts            # App entry point
│   ├── env.ts              # Environment variable definitions
│   ├── getMyRoutes.ts      # Route configuration
│   ├── lib/                # Shared backend modules
│   │   ├── Controller.ts   # Base controller class
│   │   ├── getRouter.ts    # Route-to-Express binding
│   │   ├── getApp.ts       # Express app factory
│   │   ├── session.ts      # Redis session helpers
│   │   ├── errorHandler.ts # Error handling
│   │   └── env.ts          # Env validation
│   └── controllers/        # Route controllers
├── frontend/               # React frontend (separate package)
│   ├── src/
│   │   ├── entrypoints/    # Bundle entry points (.tsx)
│   │   └── pages/          # Page components
│   ├── css/                # Stylesheets
│   └── test/               # Frontend tests
├── views/                  # Pug templates
├── public/                 # Static assets (favicon)
│   └── pages/              # Frontend build output (gitignored)
├── test/                   # Backend & E2E tests (TypeScript source)
│   ├── main-suite/         # Backend unit tests
│   ├── e2e-suite/          # Puppeteer E2E tests
│   └── setupTests.ts       # Test setup entry
└── dist/                   # Backend build output (gitignored)
```

## Testing

- **Backend tests:** TypeScript files in `test/main-suite/` are bundled to CJS via tsdown, then executed by Jest with `light-my-request` for HTTP testing. Test setup uses `setupController` for injecting controllers into an Express app with session middleware.
- **Frontend tests:** React components tested with `@testing-library/react` in jsdom.
- **E2E tests:** Puppeteer tests in `test/e2e-suite/` that drive a real browser against the running app. The server is started once via `globalSetup` (composing jest-puppeteer's browser launch) and shared across all E2E test files. Session state is seeded in Redis and a cookie set via `page.setCookie()` in test `beforeAll` hooks.
- **Test builds:** Tests are compiled with `tsdown.test.config.mts` (CJS, inline sourcemaps) before execution.

## Adding a New Route

1. Create a controller in `src/controllers/` extending `BaseController`.
2. Override the relevant HTTP method handler(s).
3. Add the route to `src/getMyRoutes.ts` in the `RoutesConfig` object.
4. If the route uses new session keys, add them to the `allowedSessionObjectKeys` array in `src/index.ts`.
5. Create a corresponding Pug template in `views/` if it renders HTML.
6. For non-GET/POST methods (DELETE, PUT, PATCH), use a form with `method="post"` and a hidden `_method` field — see [HTTP Method Override](#http-method-override).
7. Add unit tests in `test/main-suite/` — test the controller method directly with its HTTP method, not the POST→override flow.

## Environment Variables

See `.env.example`. A Redis instance is required for sessions.

## Notes

- `npm run lint` runs Prettier with write mode **then** ESLint — fixes formatting before checking rules.
- The frontend is a separate npm workspace (not linked via workspaces; use `npm run frontend:*` scripts from root).
- Do not commit to `public/pages/` (built frontend output), `dist/`, or `.env`.

## Brain — Agent Memory

This project uses Brain for agent memory management.

**Start here when orienting:** Read `.memory/main.md` for the project roadmap, key decisions, and open problems.
Read `.memory/AGENTS.md` for the full Brain protocol reference.
Tools: memory_commit, memory_branch (create/switch/merge)

# remember-me

**Purpose:** Implement "remember me" checkbox on the login page that sets a persistent session cookie with Redis TTL when checked, vs. session-only cookie when unchecked.

---

## Commit 365e2d17 | 2026-04-06T08:11:47.080Z

### Branch Purpose

Implement "remember me" checkbox functionality that sets persistent session cookies with Redis TTL when checked, versus session-only cookies when unchecked.

### Previous Progress Summary

Initial commit.

### This Commit's Contribution

- Decided on TDD approach: write tests before implementation to ensure proper cookie behavior and Redis TTL handling
- Designed the remember me workflow: checkbox in login form → read `req.body.remember` → set cookie `maxAge` (30 days) + Redis TTL when checked
- Modified session infrastructure to support optional TTL: `setupSession` and `setStringValueFromSession` now accept `ttlSeconds` parameter
- Updated Login controller to handle the remember me flag and pass appropriate TTL values (30 days when checked, undefined when unchecked)
- Ensured Logout.ts clears cookies properly for both session and persistent cookie scenarios
- Planned constant definitions for remember me duration (30 days) in milliseconds and seconds for consistent time handling across components

---

## Commit b4a87ff1 | 2026-04-06T08:16:16.079Z

### Branch Purpose

Implement "remember me" functionality on the login page that sets persistent session cookies with Redis TTL when checked, versus session-only cookies when unchecked.

### Previous Progress Summary

Initial commit established the TDD approach for implementing "remember me" functionality, deciding to write tests before implementation to ensure proper cookie behavior and Redis TTL handling.

### This Commit's Contribution

- Implemented "remember me" checkbox functionality: added checkbox to login.pug form with `name="remember"` field
- Modified session.ts to support TTL parameters: added `REMEMBER_ME_TTL_MS` constant (30 days), updated `setupSession` and `setStringValueFromSession` with optional `ttlMs` parameter that propagates to Redis SET command with EX option
- Updated Login controller to handle remember flag: reads `req.body.remember`, passes TTL to session helpers, sets cookie with appropriate `maxAge` (30 days when checked, undefined when unchecked)
- Wrote comprehensive tests first (TDD approach): session TTL tests verify Redis expiry behavior, login tests verify persistent vs session-only cookies
- All tests pass with 100% coverage, maintaining existing functionality while adding new features

---

## Commit d1759745 | 2026-04-06T08:33:04.597Z

### Branch Purpose

Implement "remember me" checkbox functionality on the login page that sets persistent session cookies with Redis TTL when checked, versus session-only cookies when unchecked.

### Previous Progress Summary

Initial commit established the TDD approach for implementing "remember me" functionality, deciding to write tests before implementation to ensure proper cookie behavior and Redis TTL handling. The first commit implemented the core "remember me" workflow: checkbox in login form → reading `req.body.remember` → setting cookie `maxAge` (30 days) + Redis TTL when checked. The second commit completed the implementation by adding the checkbox to login.pug, modifying session.ts with `REMEMBER_ME_TTL_MS` constant and optional TTL parameters, updating the Login controller to handle the remember flag, and writing comprehensive tests that verify both Redis expiry behavior and cookie persistence.

### This Commit's Contribution

- Added default Redis expiry for all sessions: implemented `SESSION_TTL_MS` constant (24 hours) to prevent permanent Redis keys from accumulating
- Modified session handling functions: `setupSession` and `setStringValueFromSession` now always set Redis expiry - defaulting to 24h, overridden by 30d when 'remember me' is checked
- Updated tests comprehensively: rewrote 2 existing tests to assert default TTL behavior instead of no-expiry, added 3 new constant definition tests to verify TTL constants
- Ensured proper TTL precedence: unchecked 'remember me' uses 24h default, checked uses 30d override, eliminating session scenarios with indefinite Redis persistence
- Maintained 100% test coverage with all backend, frontend, and E2E tests passing cleanly

---

## Commit 74f6cff7 | 2026-04-06T09:37:16.260Z

### Branch Purpose

Implement "remember me" functionality on the login page that sets persistent session cookies with Redis TTL when checked, versus session-only cookies when unchecked, and replace auto-registration with initial user management via environment variables.

### Previous Progress Summary

The branch began implementing "remember me" functionality through a TDD approach, establishing the workflow of adding a checkbox to the login form that controls cookie persistence and Redis TTL. Early commits implemented the core session infrastructure changes, adding TTL support to `setupSession` and `setStringValueFromSession` with `REMEMBER_ME_TTL_MS` (30 days) constant. The branch then evolved to include default Redis expiry with `SESSION_TTL_MS` (24 hours) to prevent permanent key accumulation. Most recently, the branch shifted from auto-creating new users on login to using `INITIAL_USER_USERNAME` and `INITIAL_USER_PASSWORD` environment variables with an `ensureInitialUser()` startup function that creates or resets the initial user's credentials, while keeping the Login controller focused solely on authentication of existing users.

### This Commit's Contribution

- Replaced auto-registration on login with environment-variable-driven initial user management using `INITIAL_USER_USERNAME` and `INITIAL_USER_PASSWORD` env vars
- Implemented `ensureInitialUser()` startup function that creates the user if missing or resets the password to match env var values, ensuring consistent initial credentials
- Modified Login controller to remove user creation logic, making it solely responsible for authenticating existing users instead of auto-registering new ones
- Updated `.env.example` with new initial user credentials and added startup call to `beforeAppStartup` in `src/index.ts`
- Refactored tests to remove "creates a new user" test from login suite and added comprehensive tests for `ensureInitialUser` function covering both creation and password reset scenarios
- Updated E2E globalSetup to use initial user credentials instead of creating separate test users, maintaining test consistency with the new approach
- All tests pass with 100% coverage across 122 tests, maintaining existing functionality while improving security and predictability of user management

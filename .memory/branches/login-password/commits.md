# login-password

**Purpose:** Add password field and authentication to the login page: migration for password_hash column, bcrypt hashing, updated Login controller, Pug template, and tests.

---

## Commit 005b2fe7 | 2026-04-05T09:01:13.466Z

### Branch Purpose

Add password field and authentication to the login page: migration for password_hash column, bcrypt hashing, updated Login controller, Pug template, and tests.

### Previous Progress Summary

Initial commit. Implemented complete password authentication system including bcrypt hashing with SALT_ROUNDS=12, database migration to add password_hash column with NOT NULL DEFAULT '' for backward compatibility, updated Login controller to validate passwords and register new users with hashed passwords, updated Pug template with password input field, and comprehensive 8-test suite covering login success/failure scenarios, user registration, and session management. All 95 backend tests pass with 100% coverage.

### This Commit's Contribution

- Decided on bcrypt with SALT_ROUNDS=12 for password hashing based on security best practices
- Chose register-on-first-login approach where new users are created with hashed passwords on initial login
- Implemented tests-first methodology, creating comprehensive test suite before implementation
- Used NOT NULL DEFAULT '' migration strategy to maintain backward compatibility with existing seeded users
- Added bcrypt to alwaysBundle configuration due to native module dependencies requiring bundling
- Confirmed all existing tests (counter, logout, E2E) remain unaffected by the password changes
- Verified successful build and deployment pipeline integration
- Established separation of concerns with dedicated password utility module for hash/verify operations

---

## Commit 774f1bf9 | 2026-04-05T09:54:19.866Z

### Merge from refactor-clarity

Refactored SessionCounter and Login controllers for clarity:

- SessionCounter.ensureLoggedIn now returns userId | null (was boolean), eliminating duplicate getUserId calls and replacing magic -1 with null
- Login.authenticateUser extracted from POST handler for single responsibility
- test/helpers/user.ts created with cleanTestUser helper, used in login tests
  All 95 tests pass with 100% coverage.

---

## Commit 8de49baa | 2026-04-05T10:54:14.813Z

### Branch Purpose

Implement global authentication middleware that protects all routes by default with exempt public paths, eliminating per-controller auth checks and establishing a centralized security model.

### Previous Progress Summary

Initial commit implemented complete password authentication system with bcrypt hashing, database migration for password_hash column, updated Login controller with password validation and user registration, and comprehensive test coverage. Subsequent merge from refactor-clarity branch improved architecture by extracting Login.authenticateUser method, refactoring SessionCounter.ensureLoggedIn to return userId | null instead of boolean (eliminating duplicate getUserId calls), creating test/helpers/user.ts with cleanTestUser helper, and replacing magic -1 return values with null for better code clarity. All work maintains 100% test coverage across 95 backend tests.

### This Commit's Contribution

- Decided on global auth middleware approach over per-controller checks to ensure consistent security and eliminate redundant authentication logic across controllers
- Implemented PUBLIC_PATHS array to define route exemptions (GET /login, POST /login) while protecting all other routes by default
- Mounted auth middleware at router level in getRouter.ts to automatically protect all current and future routes without manual controller updates
- Refactored Home controller to redirect logged-in users to /counter since the home page is now behind authentication
- Removed per-controller auth checks from SessionCounter, simplifying the controller and delegating security to the global middleware
- Created comprehensive auth.test.ts testing the middleware behavior for public vs protected routes, session validation, and user_id checking
- Updated all affected unit tests (home.test.ts, counter.test.ts) to work with the new auth model, removing redundant redirect tests that are now handled by middleware

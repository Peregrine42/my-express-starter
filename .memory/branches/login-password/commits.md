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

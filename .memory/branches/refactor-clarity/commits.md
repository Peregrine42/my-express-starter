# refactor-clarity

**Purpose:** Refactor login-password changes for clarity of intent, DRY, and separation of concerns

---

## Commit fc06d22f | 2026-04-05T09:54:06.090Z

### Branch Purpose

Refactor login-password changes for clarity of intent, DRY, and separation of concerns.

### Previous Progress Summary

Initial commit.

### This Commit's Contribution

- SessionCounter: `ensureLoggedIn` now returns `userId | null`, eliminating duplicate `getUserId` calls (halves Redis round-trips per request)
- SessionCounter: `getUserId` returns `null` instead of magic number `-1` for better null-safety semantics
- Login: Extracted `authenticateUser` method — POST handler now reads as: validate → authenticate → session → redirect
- Login: Added comment explaining why password is intentionally not trimmed (spaces are significant for passphrases)
- Test: Extracted `cleanTestUser` helper to `test/helpers/user.ts`, used in both `afterAll` and registration test cleanup

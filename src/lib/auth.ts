import type express from "express";
import { hasSession, getStringValueFromSession } from "./session";

/**
 * Paths that are public (do not require authentication).
 * Everything else is protected by default.
 */
export const PUBLIC_PATHS = ["/login"];

/**
 * Check if a redirect URL is safe (relative path only).
 * Prevents open redirect attacks.
 */
export function isSafeRedirect(url: string): boolean {
  return url.startsWith("/") && !url.startsWith("//");
}

/**
 * Middleware that enforces authentication on all routes.
 * Exemptions are defined in PUBLIC_PATHS.
 *
 * This should be mounted on the router (not the app) so it applies
 * to all current and future routes automatically.
 */
export function requireAuth(): express.Handler {
  return async (req, res, next) => {
    // Allow public paths through without authentication
    if (PUBLIC_PATHS.includes(req.path)) {
      return next();
    }

    // Check for a valid session
    if (!req.cookies?.session || !(await hasSession(req, res))) {
      const redirect = encodeURIComponent(req.originalUrl || "/");
      return res.redirect(`/login?redirect=${redirect}`);
    }

    // Check for user_id in the session
    try {
      const userId = await getStringValueFromSession(req, res, "user_id");
      if (!userId) {
        const redirect = encodeURIComponent(req.originalUrl || "/");
        return res.redirect(`/login?redirect=${redirect}`);
      }
    } catch {
      const redirect = encodeURIComponent(req.originalUrl || "/");
      return res.redirect(`/login?redirect=${redirect}`);
    }

    next();
  };
}

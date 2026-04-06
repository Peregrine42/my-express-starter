import type express from "express";
import Redis from "ioredis";
import { csrfSync } from "csrf-sync";

const CSRF_KEY_PREFIX = "session:csrf_token:";

const { csrfSynchronisedProtection } = csrfSync({
  getTokenFromState: (req) => {
    return req._csrfSyncToken;
  },
  storeTokenInState: (req, token) => {
    // token can be string | null | undefined per CsrfSyncedToken type;
    // both null and undefined are falsy, so no need for ?? undefined
    req._csrfSyncToken = token as string | undefined;
  },
  getTokenFromRequest: (req) => {
    // Form submissions use _csrf hidden field
    if (req.body?._csrf) {
      return req.body._csrf as string;
    }
    // API calls use header
    return req.headers["x-csrf-token"] as string | undefined;
  },
});

/**
 * Pre-load the CSRF token from Redis into `req._csrfSyncToken`.
 * Must run before `csrfSynchronisedProtection`.
 */
function csrfPreload(): express.Handler {
  return async (req, _res, next) => {
    const sessionId = req.cookies?.session;
    if (sessionId) {
      const redis = new Redis({ keyPrefix: CSRF_KEY_PREFIX });
      try {
        const val = await redis.get(sessionId);
        req._csrfSyncToken = val ?? undefined;
      } finally {
        redis.disconnect();
      }
    }
    next();
  };
}

/**
 * Attach `csrfToken` to the request (for programmatic use) and
 * to `res.locals` (so Pug templates can use it as `csrfToken`).
 *
 * Must run after `csrfSynchronisedProtection` which sets `req.csrfToken`.
 */
function csrfHelper(): express.Handler {
  return (req, res, next) => {
    res.locals.csrfToken = (req.csrfToken as () => string)();
    next();
  };
}

/**
 * Persist the CSRF token to Redis after the response is sent.
 * Listens for the 'finish' event so it runs after the controller.
 */
function csrfPersist(): express.Handler {
  return (req, res, next) => {
    res.on("finish", () => {
      const token = req._csrfSyncToken;
      if (token && req.cookies?.session) {
        const redis = new Redis({ keyPrefix: CSRF_KEY_PREFIX });
        redis.set(req.cookies.session, token).finally(() => {
          redis.disconnect();
        });
      }
    });

    next();
  };
}

declare global {
  namespace Express {
    interface Request {
      _csrfSyncToken?: string;
      csrfToken: (overwrite?: boolean) => string;
    }
    interface Locals {
      csrfToken: string;
    }
  }
}

export { csrfPreload, csrfSynchronisedProtection, csrfHelper, csrfPersist };

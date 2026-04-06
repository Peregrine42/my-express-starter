import crypto from "crypto";
import Redis from "ioredis";
import express from "express";

/* istanbul ignore next */
export function generateSessionId() {
  return crypto.randomUUID().toString();
}

export type SessionReq = { cookies?: { session?: string } };
export type SessionRes = { locals: { allowedSessionObjectKeys: string[] } };

export async function getStringValueFromSession(
  req: SessionReq,
  res: SessionRes,
  key: string,
) {
  if (!res.locals.allowedSessionObjectKeys.includes(key)) {
    throw new Error(
      `
Invalid session object key! '${key}'
Allowed keys: ${res.locals.allowedSessionObjectKeys.join(", ")}
`.trim(),
    );
  }

  if (req.cookies?.session && (await hasSession(req, res))) {
    const redis = new Redis({ keyPrefix: `session:${key}:` });
    try {
      return await redis.get(req.cookies.session);
    } finally {
      redis.disconnect();
    }
  }

  throw new Error("No session!");
}

export async function setStringValueFromSession(
  req: SessionReq,
  res: SessionRes,
  key: string,
  value: string,
) {
  if (!res.locals.allowedSessionObjectKeys.includes(key)) {
    throw new Error(
      `
Invalid session object key! '${key}'
Allowed keys: ${res.locals.allowedSessionObjectKeys.join(", ")}
`.trim(),
    );
  }

  let result = false;

  if (req.cookies?.session && (await hasSession(req, res))) {
    const redis = new Redis({ keyPrefix: `session:${key}:` });
    try {
      await redis.set(req.cookies.session, value);
      result = true;
    } finally {
      redis.disconnect();
    }
  } else {
    throw new Error("No session!");
  }

  return result;
}

export async function incrementNumericStringValueFromSession(
  { cookies: { session: sessionId } = {} }: SessionReq,
  { locals: { allowedSessionObjectKeys } }: SessionRes,
  key: string,
): Promise<string> {
  if (!allowedSessionObjectKeys.includes(key)) {
    throw new Error(
      `
Invalid session object key! '${key}'
Allowed keys: ${allowedSessionObjectKeys.join(", ")}
`.trim(),
    );
  }

  if (sessionId) {
    const redis = new Redis({ keyPrefix: `session:${key}:` });
    let result;
    try {
      result = (await redis.incr(sessionId)).toString();
    } finally {
      redis.disconnect();
    }
    return result;
  } else {
    throw new Error("No session!");
  }
}

export async function decrementNumericStringValueFromSession(
  { cookies: { session: sessionId } = {} }: SessionReq,
  { locals: { allowedSessionObjectKeys } }: SessionRes,
  key: string,
): Promise<string> {
  if (!allowedSessionObjectKeys.includes(key)) {
    throw new Error(
      `
Invalid session object key! '${key}'
Allowed keys: ${allowedSessionObjectKeys.join(", ")}
`.trim(),
    );
  }

  if (sessionId) {
    const redis = new Redis({ keyPrefix: `session:${key}:` });
    try {
      return (await redis.decr(sessionId)).toString();
    } finally {
      redis.disconnect();
    }
  } else {
    throw new Error("No session!");
  }
}

/**
 * Destroy all Redis keys for a given session ID.
 * Deletes the session existence key plus all per-field keys.
 */
export async function destroySession(sessionId: string): Promise<void> {
  const redis = new Redis();
  try {
    // Get all keys matching session:*:<sessionId> using SCAN
    const stream = redis.scanStream({
      match: `session:*:${sessionId}`,
      count: 100,
    });
    const pipeline = redis.pipeline();
    for await (const keys of stream) {
      for (const key of keys) {
        pipeline.del(key);
      }
    }
    await pipeline.exec();
  } finally {
    redis.disconnect();
  }
}

export type SessionOpts = {
  allowedSessionObjectKeys: string[];
};

export function sessionSetupMiddleware(opts: SessionOpts): express.Handler {
  return (_req, res, next) => {
    res.locals.allowedSessionObjectKeys = opts.allowedSessionObjectKeys;
    next();
  };
}

export async function setupSession(
  _req: SessionReq,
  _res: SessionRes,
  sessionIdOverride?: string,
) {
  let result: boolean = false;
  const sessionId = sessionIdOverride || generateSessionId();

  const redis = new Redis({ keyPrefix: `session::` });
  try {
    await redis.set(sessionId, "present");
    result = true;
  } finally {
    redis.disconnect();
  }

  return result;
}

export async function hasSession(
  { cookies: { session: sessionId } = {} }: SessionReq,
  _res: SessionRes,
) {
  let value = false;

  if (sessionId) {
    const redis = new Redis({ keyPrefix: `session::` });
    try {
      if ((await redis.get(sessionId)) === "present") {
        value = true;
      }
    } finally {
      redis.disconnect();
    }
  }

  return value;
}

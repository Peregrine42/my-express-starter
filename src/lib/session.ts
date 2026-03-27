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

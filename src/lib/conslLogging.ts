import crypto from "crypto";

export type Cons = {
  error?: typeof console.error;
  log?: typeof console.log;
  warn?: typeof console.warn;
};

type Req = {
  url?: string;
  method?: string;
};
type Res = {
  locals: {
    reqId?: string;
    console: Cons;
  };
};

export type Consl = {
  (
    level: keyof Res["locals"]["console"],
    req: Req,
    res: Res,
    ...messages: unknown[]
  ): unknown[];
  (
    level: keyof Res["locals"]["console"],
    res: Res,
    ...messages: unknown[]
  ): unknown[];
  (level: keyof Res["locals"]["console"], ...messages: unknown[]): unknown[];
};

export const consl: Consl = (level, r1, r2, ...messages) => {
  const res = r2 as Res;
  const r2IsRes = res?.locals?.console;
  if (r2IsRes) {
    const req = r1 as Req;
    const payload = [
      level.toLocaleUpperCase(),
      req?.method?.toLocaleUpperCase(),
      req?.url,
      ...messages,
    ];

    if (res.locals.reqId) {
      const reqId = res.locals.reqId;
      payload.unshift(`reqId:${reqId}`);
    }

    res.locals.console?.[level]?.(...payload);
    return payload;
  }

  const req = r1 as Res;
  const r1IsRes = req?.locals?.console;
  if (r1IsRes) {
    const payload = [level.toLocaleUpperCase(), ...messages];

    if (req.locals.reqId) {
      const reqId = req.locals.reqId;
      payload.unshift(`reqId:${reqId}`);
    }

    req.locals.console?.[level]?.(r2, ...messages);
    return payload;
  }

  messages.unshift(r2);
  messages.unshift(r1);
  const payload = [level.toLocaleUpperCase(), ...messages];
  console[level](...messages);
  return payload;
};

export const setupConslLogging =
  ({
    console: cons,
    addReqId,
  }: {
    console?: Cons;
    addReqId?: boolean;
  } = {}) =>
  (_req: Req, res: Res, next: () => void) => {
    if (addReqId) {
      res.locals.reqId = crypto.randomUUID();
    }

    if (cons) {
      res.locals.console = cons;
    } else {
      res.locals.console = console;
    }
    next();
  };

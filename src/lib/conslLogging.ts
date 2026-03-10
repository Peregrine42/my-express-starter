import crypto from "crypto";
import express from "express";

export type ConsoleOverride = Partial<{
  error: typeof console.error;
  log: typeof console.log;
  warn: typeof console.warn;
  trace: typeof console.trace;
}>;

type Req = {
  url?: string;
  method?: string;
};
type Res = {
  locals: {
    reqId?: string;
    consl: Consl;
  };
};

export type Consl = {
  (
    level: keyof ConsoleOverride,
    req: Req,
    res: Res,
    ...messages: unknown[]
  ): unknown[];
  (level: keyof ConsoleOverride, res: Res, ...messages: unknown[]): unknown[];
  (level: keyof ConsoleOverride, ...messages: unknown[]): unknown[];
};

export const initConsl: ({
  consoleObj,
}: {
  consoleObj: Required<ConsoleOverride>;
}) => Consl = ({ consoleObj }) => {
  return (level, ...messages) => {
    const r1 = messages[0] as Req;
    const r2 = messages[1] as Res | undefined;

    const r1IsReq = r1?.method;
    if (r1IsReq) {
      const req = r1;
      const res = r2;
      const payload = [
        level.toLocaleUpperCase(),
        req?.method?.toLocaleUpperCase(),
        req?.url,
        ...messages.slice(2),
      ];

      if (res?.locals?.reqId) {
        const reqId = res.locals.reqId;
        payload.unshift(`reqId:${reqId}`);
      }

      consoleObj[level](...payload);
      return payload;
    }

    const req = r1 as Res;
    const r1IsRes = req?.locals;
    if (r1IsRes) {
      const payload = [level.toLocaleUpperCase(), ...messages.slice(1)];

      if (req.locals.reqId) {
        const reqId = req.locals.reqId;
        payload.unshift(`reqId:${reqId}`);
      }

      consoleObj[level]?.(...payload);
      return payload;
    }

    const payload = [level.toLocaleUpperCase(), ...messages];
    consoleObj[level](payload);
    return payload;
  };
};

export const setupConslLogging = ({
  consoleOverride,
  addReqId,
}: {
  consoleOverride?: ConsoleOverride;
  addReqId?: boolean;
} = {}): [Consl, express.Handler] => {
  const consoleObj: Required<ConsoleOverride> = {
    error: consoleOverride?.error || console.error,
    log: consoleOverride?.log || console.log,
    warn: consoleOverride?.warn || console.warn,
    trace: consoleOverride?.trace || console.trace,
  };

  const consl = initConsl({ consoleObj });

  return [
    consl,
    (_req, res, next: () => void) => {
      if (addReqId) {
        res.locals.reqId = crypto.randomUUID();
      }

      res.locals.consl = consl;
      next();
    },
  ];
};

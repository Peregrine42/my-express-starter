import crypto from "crypto";
import express from "express";
import { BaseController } from "../lib/Controller";
import { Redis } from "ioredis";

export class SessionCounter extends BaseController {
  GET = async (req: express.Request, res: express.Response) => {
    let value: number = 0;
    let sessionId: string | undefined = req.cookies.session;

    const redis = new Redis({ keyPrefix: "session:counter:" });
    try {
      if (sessionId) {
        value = await redis.incr(sessionId);
      } else {
        sessionId = crypto.randomUUID().toString();
        value = await redis.incr(sessionId);
      }
    } finally {
      redis.disconnect();
    }

    res.cookie("session", sessionId);
    res.render("counter", { value });
  };

  POST = async (req: express.Request, res: express.Response) => {
    const redis = new Redis({ keyPrefix: "session:counter:" });
    try {
      const value = await redis.incr(req.cookies.session);
      res.render("counter", { value });
    } finally {
      redis.disconnect();
    }
  };
}

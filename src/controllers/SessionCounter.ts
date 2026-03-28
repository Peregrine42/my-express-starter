import express from "express";
import { BaseController } from "../lib/Controller";
import {
  generateSessionId,
  getStringValueFromSession,
  incrementNumericStringValueFromSession,
  decrementNumericStringValueFromSession,
  hasSession,
  setupSession,
} from "../lib/session";

export class SessionCounter extends BaseController {
  private ensureSession = async (
    req: express.Request,
    res: express.Response,
  ) => {
    if (await hasSession(req, res)) {
      return;
    }

    const sessionId = generateSessionId();
    await setupSession(req, res, sessionId);
    res.cookie("session", sessionId, { path: "/" });
    req.cookies.session = sessionId;
  };

  GET = async (req: express.Request, res: express.Response) => {
    await this.ensureSession(req, res);

    const counter = Number(
      (await getStringValueFromSession(req, res, "counter")) || "0",
    );
    res.render("counter", { value: counter });
  };

  POST = async (req: express.Request, res: express.Response) => {
    await this.ensureSession(req, res);

    const value = await incrementNumericStringValueFromSession(
      req,
      res,
      "counter",
    );
    res.render("counter", { value });
  };

  DELETE = async (req: express.Request, res: express.Response) => {
    await this.ensureSession(req, res);

    const value = await decrementNumericStringValueFromSession(
      req,
      res,
      "counter",
    );
    res.render("counter", { value });
  };
}

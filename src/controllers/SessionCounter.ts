import express from "express";
import { BaseController } from "../lib/Controller";
import {
  getStringValueFromSession,
  incrementNumericStringValueFromSession,
} from "../lib/session";

export class SessionCounter extends BaseController {
  GET = async (req: express.Request, res: express.Response) => {
    const counter = Number(
      (await getStringValueFromSession(req, res, "counter")) || "0",
    );
    res.render("counter", { value: counter });
  };

  POST = async (req: express.Request, res: express.Response) => {
    const value = await incrementNumericStringValueFromSession(
      req,
      res,
      "counter",
    );
    res.render("counter", { value });
  };
}

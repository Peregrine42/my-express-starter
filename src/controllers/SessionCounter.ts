import express from "express";
import { BaseController } from "../lib/Controller";

export class SessionCounter extends BaseController {
  GET = async (_req: express.Request, res: express.Response) => {
    res.render("counter");
  };

  POST = async (_req: express.Request, res: express.Response) => {
    res.render("counter");
  };
}

import express from "express";
import { BaseController } from "../lib/Controller";
import { destroySession } from "../lib/session";

export class Logout extends BaseController {
  POST = async (req: express.Request, res: express.Response) => {
    if (req.cookies?.session) {
      await destroySession(req.cookies.session);
    }
    res.clearCookie("session", { path: "/" });
    res.redirect("/login");
  };
}

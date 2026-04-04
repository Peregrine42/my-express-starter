import express from "express";
import { BaseController } from "../lib/Controller";

export class Logout extends BaseController {
  POST = async (_req: express.Request, res: express.Response) => {
    res.clearCookie("session", { path: "/" });
    res.redirect("/login");
  };
}

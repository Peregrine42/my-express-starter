import express from "express";
import { BaseController } from "../Controller";

export class Home extends BaseController {
  GET(_req: express.Request, res: express.Response) {
    res.render("index");
  }
}

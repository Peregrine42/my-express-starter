import express from "express";

function notFound(_req: express.Request, res: express.Response) {
  res.status(404).send("");
}

export abstract class Controller {
  abstract GET(
    req: express.Request,
    res: express.Response,
  ): Promise<void> | void;
  abstract POST(
    req: express.Request,
    res: express.Response,
  ): Promise<void> | void;
  abstract FALLBACK(
    req: express.Request,
    res: express.Response,
  ): Promise<void> | void;
  abstract HEAD(
    req: express.Request,
    res: express.Response,
  ): Promise<void> | void;
  abstract OPTIONS(
    req: express.Request,
    res: express.Response,
  ): Promise<void> | void;
  abstract PUT(
    req: express.Request,
    res: express.Response,
  ): Promise<void> | void;
  abstract PATCH(
    req: express.Request,
    res: express.Response,
  ): Promise<void> | void;
  abstract DELETE(
    req: express.Request,
    res: express.Response,
  ): Promise<void> | void;
}

export class BaseController extends Controller {
  constructor() {
    super();
  }

  GET = (req: express.Request, res: express.Response) => {
    return this.FALLBACK(req, res);
  };
  POST = (req: express.Request, res: express.Response) => {
    return this.FALLBACK(req, res);
  };
  HEAD = (req: express.Request, res: express.Response) => {
    return this.FALLBACK(req, res);
  };
  OPTIONS = (req: express.Request, res: express.Response) => {
    return this.FALLBACK(req, res);
  };
  PUT = (req: express.Request, res: express.Response) => {
    return this.FALLBACK(req, res);
  };
  PATCH = (req: express.Request, res: express.Response) => {
    return this.FALLBACK(req, res);
  };
  DELETE = (req: express.Request, res: express.Response) => {
    return this.FALLBACK(req, res);
  };
  FALLBACK = (req: express.Request, res: express.Response) => {
    return notFound(req, res);
  };
}

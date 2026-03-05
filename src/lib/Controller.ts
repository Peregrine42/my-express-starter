import express from "express";

function notFound(_req: express.Request, res: express.Response) {
  res.status(404).send("");
}

export abstract class Controller {
  abstract GET(req: express.Request, res: express.Response): void;
  abstract POST(req: express.Request, res: express.Response): void;
  abstract FALLBACK(req: express.Request, res: express.Response): void;
  abstract HEAD(req: express.Request, res: express.Response): void;
  abstract OPTIONS(req: express.Request, res: express.Response): void;
  abstract PUT(req: express.Request, res: express.Response): void;
  abstract PATCH(req: express.Request, res: express.Response): void;
  abstract DELETE(req: express.Request, res: express.Response): void;
}

export class BaseController extends Controller {
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

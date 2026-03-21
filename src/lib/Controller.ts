import express from "express";

export function isRes(
  res: Partial<typeof express.response> | typeof express.response,
): res is typeof express.response {
  if (res.status === express.response.status) {
    return true;
  } else {
    return false;
  }
}

export function isReq(
  req: Partial<typeof express.request> | typeof express.request,
): req is typeof express.request {
  if (req.headers === express.request.headers) {
    return true;
  } else {
    return false;
  }
}

function notFound(
  _req: Partial<typeof express.request>,
  res: Partial<typeof express.response>,
) {
  if (isRes(res)) {
    res.status(404).send("");
  } else {
    throw new Error("");
  }
}

export abstract class Controller {
  abstract GET(
    req: Partial<typeof express.request>,
    res: Partial<typeof express.response>,
  ): Promise<void>;
  abstract POST(
    req: Partial<typeof express.request>,
    res: Partial<typeof express.response>,
  ): Promise<void>;
  abstract FALLBACK(
    req: Partial<typeof express.request>,
    res: Partial<typeof express.response>,
  ): Promise<void>;
  abstract HEAD(
    req: Partial<typeof express.request>,
    res: Partial<typeof express.response>,
  ): Promise<void>;
  abstract OPTIONS(
    req: Partial<typeof express.request>,
    res: Partial<typeof express.response>,
  ): Promise<void>;
  abstract PUT(
    req: Partial<typeof express.request>,
    res: Partial<typeof express.response>,
  ): Promise<void>;
  abstract PATCH(
    req: Partial<typeof express.request>,
    res: Partial<typeof express.response>,
  ): Promise<void>;
  abstract DELETE(
    req: Partial<typeof express.request>,
    res: Partial<typeof express.response>,
  ): Promise<void>;
}

export class BaseController extends Controller {
  constructor() {
    super();
  }

  GET = async (req: typeof express.request, res: typeof express.response) => {
    return this.FALLBACK(req, res);
  };
  POST = async (req: typeof express.request, res: typeof express.response) => {
    return this.FALLBACK(req, res);
  };
  HEAD = async (req: typeof express.request, res: typeof express.response) => {
    return this.FALLBACK(req, res);
  };
  OPTIONS = async (
    req: typeof express.request,
    res: typeof express.response,
  ) => {
    return this.FALLBACK(req, res);
  };
  PUT = async (req: typeof express.request, res: typeof express.response) => {
    return this.FALLBACK(req, res);
  };
  PATCH = async (req: typeof express.request, res: typeof express.response) => {
    return this.FALLBACK(req, res);
  };
  DELETE = async (
    req: typeof express.request,
    res: typeof express.response,
  ) => {
    return this.FALLBACK(req, res);
  };
  FALLBACK = async (
    req: typeof express.request,
    res: typeof express.response,
  ) => {
    return notFound(req, res);
  };
}

import type express from "express";
import { consl } from "./conslLogging";

export const errorHandler: express.ErrorRequestHandler = (
  err,
  req,
  res,
  _next,
) => {
  consl("error", req, res, err.stack);
  const statusCode = 500;
  res.status(statusCode).send("Internal Server Error");
};

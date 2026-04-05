import type express from "express";

export const errorHandler: express.ErrorRequestHandler = (
  err,
  req,
  res,
  _next,
) => {
  const statusCode = (err as { statusCode?: number }).statusCode || 500;
  if (statusCode === 500) {
    res.locals.consl("error", req, res, err.stack);
  } else {
    res.locals.consl("warn", req, res, `${statusCode}: ${err.message}`);
  }
  res
    .status(statusCode)
    .send(statusCode === 500 ? "Internal Server Error" : err.message);
};

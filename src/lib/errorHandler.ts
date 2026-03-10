import type express from "express";

export const errorHandler: express.ErrorRequestHandler = (
  err,
  req,
  res,
  _next,
) => {
  res.locals.consl("error", req, res, err.stack);
  const statusCode = 500;
  res.status(statusCode).send("Internal Server Error");
};

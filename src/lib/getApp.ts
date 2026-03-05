import express from "express";
import path from "path";
import compression from "compression";
import { errorHandler } from "./errorHandler";
import { Cons, setupConslLogging } from "./conslLogging";

export async function getApp({
  withApp = async (_app) => {},
  console,
  publicPath = path.join(import.meta.dirname, "..", "..", "..", "public"),
}: {
  withApp?: (_app: express.Application) => Promise<void>;
  console?: Cons;
  publicPath?: string;
} = {}) {
  const app = express();

  app.use(setupConslLogging({ addReqId: true, console }));

  app.use("/public", compression(), express.static(publicPath));
  app.set("view engine", "pug");

  await withApp(app);

  app.use(errorHandler);

  return app;
}

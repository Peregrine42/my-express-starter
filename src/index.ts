import express from "express";
import methodOverride from "method-override";
import { getRouter } from "./lib/getRouter";
import { getApp } from "./lib/getApp";
import { getMyRoutes } from "./getMyRoutes";
import { envVarNames } from "./env";
import { validateEnv } from "./lib/env";
import { sessionSetupMiddleware } from "./lib/session";

declare global {
  namespace Express {
    interface Locals {
      allowedSessionObjectKeys: string[];
    }
  }
}

(async () => {
  validateEnv(envVarNames);

  const routes = getMyRoutes();
  const myRouter = await getRouter(routes);
  const [_app, startApp] = await getApp({
    withApp: async (app) => {
      app.use(
        "/",
        sessionSetupMiddleware({ allowedSessionObjectKeys: ["counter"] }),
      );
      app.use(express.urlencoded({ extended: false }));
      app.use(methodOverride((req) => req.body?._method));
      app.use("/", myRouter);
    },
  });

  await startApp();
  console.log("🚀 Server launched — happy coding!");
})().catch((e) => {
  process.exitCode = 1;
  console.error(e);
});

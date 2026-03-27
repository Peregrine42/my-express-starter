import express from "express";
import methodOverride from "method-override";
import { sessionSetupMiddleware } from "../src/lib/session";
import { BaseController } from "../src/lib/Controller";
import { Method } from "../src/lib/getRouter";
import { setupController } from "./main-suite/lib/setupController";

export const setupMyController = async (
  controllerPair: [typeof BaseController, Method],
  withApp: (_app: express.Application) => Promise<void> = async () => {},
) => {
  return setupController(controllerPair, {
    withApp: async (app) => {
      app.use(
        "/",
        sessionSetupMiddleware({ allowedSessionObjectKeys: ["counter"] }),
      );
      app.use(express.urlencoded({ extended: false }));
      app.use(methodOverride((req) => req.body?._method));

      await withApp(app);
    },
  });
};

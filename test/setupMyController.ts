import express from "express";
import { attachAppMiddleware } from "../src/lib/attachMiddleware";
import { BaseController } from "../src/lib/Controller";
import { Method } from "../src/lib/getRouter";
import { setupController } from "./main-suite/lib/setupController";

export const setupMyController = async (
  controllerPair: [typeof BaseController, Method],
  withApp: (_app: express.Application) => Promise<void> = async () => {},
) => {
  return setupController(controllerPair, {
    withApp: async (app) => {
      await attachAppMiddleware(app, { withRouter: false });
      await withApp(app);
    },
  });
};

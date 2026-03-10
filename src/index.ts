import dotenv from "dotenv";
dotenv.config();
import { getRouter } from "./lib/getRouter";
import { getApp } from "./lib/getApp";
import { getMyRoutes } from "./getMyRoutes";
import { envVarNames } from "./env";
import { validateEnv } from "./lib/env";

(async () => {
  validateEnv(envVarNames);

  const routes = getMyRoutes();
  const myRouter = await getRouter(routes);
  const [_app, startApp] = await getApp({
    withApp: async (app) => {
      app.use("/", myRouter);
    },
  });

  await startApp();
})().catch((e) => {
  process.exitCode = 1;
  console.error(e);
});

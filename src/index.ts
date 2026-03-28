import { getApp } from "./lib/getApp";
import { attachAppMiddleware } from "./lib/attachMiddleware";
import { envVarNames } from "./env";
import { validateEnv } from "./lib/env";

declare global {
  namespace Express {
    interface Locals {
      allowedSessionObjectKeys: string[];
    }
  }
}

(async () => {
  validateEnv(envVarNames);

  const [_app, startApp] = await getApp({
    withApp: (app) => {
      return attachAppMiddleware(app);
    },
  });

  await startApp();
  console.log("🚀 Server launched!");
})().catch((e) => {
  process.exitCode = 1;
  console.error(e);
});

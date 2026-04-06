import { getApp } from "./lib/getApp";
import { attachAppMiddleware } from "./lib/attachMiddleware";
import { envVarNames } from "./env";
import { validateEnv } from "./lib/env";
import { createMigrator } from "./migrations/runner";
import { ensureInitialUser } from "./lib/initialUser";

declare global {
  namespace Express {
    interface Locals {
      allowedSessionObjectKeys: string[];
      isLoggedIn: boolean;
    }
  }
}

(async () => {
  validateEnv(envVarNames);

  const [_app, startApp] = await getApp({
    beforeAppStartup: async () => {
      const migrator = createMigrator();
      const pending = await migrator.pending();
      if (pending.length > 0) {
        await migrator.up();
      }

      await ensureInitialUser();
    },
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

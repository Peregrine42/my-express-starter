import express from "express";
import path from "path";
import compression from "compression";
import { errorHandler } from "./errorHandler";
import { type ConsoleOverride, setupConslLogging } from "./conslLogging";
import { env } from "../env";
import { Server } from "http";

export type ShutdownApp = () => Promise<void>;
export type StartApp = () => Promise<ShutdownApp>;

export async function getApp({
  withApp = async (_app) => {},
  withAppStartupComplete = async (_app) => async () => {},
  beforeAppStartup = async (_app) => {},
  consoleOverride = console,
  publicPath = path.join(import.meta.dirname, "..", "..", "..", "public"),
}: {
  withApp?: (_app: express.Application) => Promise<void>;
  withAppStartupComplete?: (_app: express.Application) => Promise<ShutdownApp>;
  beforeAppStartup?: (_app: express.Application) => Promise<void>;
  consoleOverride?: ConsoleOverride;
  publicPath?: string;
} = {}): Promise<[express.Application, StartApp]> {
  const app = express();

  const [consl, conslMiddleware] = setupConslLogging({
    addReqId: true,
    consoleOverride,
  });

  app.use(conslMiddleware);

  app.use("/public", compression(), express.static(publicPath));
  app.set("view engine", "pug");

  await withApp(app);

  app.use(errorHandler);

  const startup: StartApp = async () => {
    const server = new Server();
    const shutdown: ShutdownApp = async () => {
      server.close();
    };

    let customShutdown: ShutdownApp = async () => {};
    try {
      server.addListener("request", app);

      await beforeAppStartup(app);

      await new Promise<void>((resolve) => {
        server.listen(parseInt(env.PORT), async () => {
          consl("log", `App is listening at http://localhost:${env.PORT}`);
          resolve();
        });
      });

      customShutdown = await withAppStartupComplete(app);

      return async () => {
        await customShutdown?.();
        await shutdown();
      };
    } catch (e) {
      await customShutdown?.();
      await shutdown();
      throw e;
    }
  };

  return [app, startup];
}

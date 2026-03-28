import { jest } from "@jest/globals";
import { getApp, ShutdownApp } from "../../../src/lib/getApp";
import { ConsoleOverride } from "../../../src/lib/conslLogging";
import axios from "axios";
import inject from "light-my-request";
import { env } from "../../../src/env";

describe("App", () => {
  describe("on start", () => {
    let shutdown: ShutdownApp | void;

    it("starts an HTTP server", async () => {
      // ARRANGE
      const [_app, startApp] = await getApp({
        withApp: async (app) => {
          app.get("/", (_req, res) => {
            res.sendStatus(200);
          });
        },
        consoleOverride: {
          log: jest.fn(),
        },
      });
      shutdown = await startApp();

      // ACT
      const resp = await axios.get(`http://localhost:${env.PORT}`);

      // ASSERT
      expect(resp.status).toEqual(200);
    });

    it("can do custom functionality after listening for requests", async () => {
      // ARRANGE
      const customShutdownCallback = jest
        .fn()
        .mockImplementation(async () => {});
      const customStartupCallback = jest
        .fn()
        .mockImplementation(async () => {});
      const [_app, startApp] = await getApp({
        withAppStartupComplete: async () => {
          await customStartupCallback();

          return async () => {
            await customShutdownCallback();
          };
        },
        consoleOverride: {
          log: jest.fn(),
        },
      });
      shutdown = await startApp();

      // ACT
      await shutdown();
      shutdown = undefined;

      // ASSERT
      expect(customStartupCallback).toHaveBeenCalled();
      expect(customShutdownCallback).toHaveBeenCalled();
    });

    afterEach(async () => {
      await shutdown?.();
    });
  });

  it("can serve static files", async () => {
    // ARRANGE
    const [app] = await getApp();

    // ACT
    const response = await inject(app, {
      method: "GET",
      url: "/public/favicon.ico",
    });

    // ASSERT
    expect(response.statusCode).toEqual(200);
    expect(response.body?.length).toBeGreaterThan(0);
  });

  it("logs errors", async () => {
    // ARRANGE
    const [app] = await getApp({
      withApp: async (app) => {
        app.get("/error-route", (_req, _res) => {
          throw new Error("Oops!");
        });
      },
      consoleOverride: {
        ...console,
        error: jest.fn(),
      } as ConsoleOverride,
    });

    // ACT
    const response = await inject(app, { method: "GET", url: "/error-route" });

    // ASSERT
    expect(response.statusCode).toEqual(500);
    expect(response.body).toEqual("Internal Server Error");
  });

  it("can shutdown cleanly on error", async () => {
    // ACT
    const act = async () => {
      const [_app, startup] = await getApp({
        beforeAppStartup: async () => {
          throw new Error("Oops!");
        },
        consoleOverride: {
          ...console,
          error: jest.fn(),
          log: jest.fn(),
        } as ConsoleOverride,
      });

      await startup();
    };
    // ASSERT

    await expect(act).rejects.toThrow(Error);
  });
});

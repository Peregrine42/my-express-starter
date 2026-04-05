import { vi } from "vitest";
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
          log: vi.fn(),
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
      const customShutdownCallback = vi.fn().mockImplementation(async () => {});
      const customStartupCallback = vi.fn().mockImplementation(async () => {});
      const [_app, startApp] = await getApp({
        withAppStartupComplete: async () => {
          await customStartupCallback();

          return async () => {
            await customShutdownCallback();
          };
        },
        consoleOverride: {
          log: vi.fn(),
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
        error: vi.fn(),
      } as ConsoleOverride,
    });

    // ACT
    const response = await inject(app, { method: "GET", url: "/error-route" });

    // ASSERT
    expect(response.statusCode).toEqual(500);
    expect(response.body).toEqual("Internal Server Error");
  });

  it("handles non-500 errors with custom status code", async () => {
    // ARRANGE
    const warnFn = vi.fn();
    const [app] = await getApp({
      withApp: async (app) => {
        app.get("/forbidden-route", (_req, _res) => {
          const err = new Error("Forbidden") as Error & { statusCode: number };
          err.statusCode = 403;
          throw err;
        });
      },
      consoleOverride: {
        ...console,
        warn: warnFn,
      } as ConsoleOverride,
    });

    // ACT
    const response = await inject(app, {
      method: "GET",
      url: "/forbidden-route",
    });

    // ASSERT
    expect(response.statusCode).toEqual(403);
    expect(response.body).toEqual("Forbidden");
    expect(warnFn).toHaveBeenCalled();
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
          error: vi.fn(),
          log: vi.fn(),
        } as ConsoleOverride,
      });

      await startup();
    };
    // ASSERT

    await expect(act).rejects.toThrow(Error);
  });
});

import supertest from "supertest";
import { getApp, ShutdownApp } from "../../../src/lib/getApp";
import { ConsoleOverride } from "../../../src/lib/conslLogging";
import axios from "axios";
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
          log: jest.fn()
        }
      });
      shutdown = await startApp();

      // ACT
      const resp = await axios.get(`http://localhost:${env.PORT}`);

      // ASSERT
      expect(resp.status).toEqual(200);
    });

    afterEach(async () => {
      await shutdown?.();
    });
  });

  it("can serve static files", async () => {
    // ARRANGE
    const [app] = await getApp();
    const testAgent = supertest(app);

    // ACT
    const response = await testAgent.get("/public/favicon.ico");

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
    const testAgent = supertest(app);

    // ACT
    const response = await testAgent.get("/error-route");

    // ASSERT
    expect(response.statusCode).toEqual(500);
    expect(response.text).toEqual("Internal Server Error");
  });
});

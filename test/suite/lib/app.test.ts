import supertest from "supertest";
import { getApp } from "../../../src/lib/getApp";
import { Cons } from "../../../src/lib/conslLogging";

describe("App", () => {
  it("can serve static files", async () => {
    // ARRANGE
    const app = await getApp();
    const testAgent = supertest(app);

    // ACT
    const response = await testAgent.get("/public/favicon.ico");

    // ASSERT
    expect(response.statusCode).toEqual(200);
    expect(response.body?.length).toBeGreaterThan(0);
  });

  it("logs errors", async () => {
    // ARRANGE
    const app = await getApp({
      withApp: async (app) => {
        app.get("/error-route", (_req, _res) => {
          throw new Error("Oops!");
        });
      },
      console: {
        ...console,
        error: jest.fn(),
      } as Cons,
    });
    const testAgent = supertest(app);

    // ACT
    const response = await testAgent.get("/error-route");

    // ASSERT
    expect(response.statusCode).toEqual(500);
    expect(response.text).toEqual("Internal Server Error");
  });
});

import express, { Router } from "express";
import { configureAndAttachRoutes } from "../../src/getRouter";
import supertest from "supertest";
import { BaseController } from "../../src/Controller";

describe("when a handler is not defined", () => {
  it("responds with 404 - index", async () => {
    // ARRANGE
    const router = Router();
    configureAndAttachRoutes(router, {}); // no routes defined - so we should get 404 for anything
    const app = express();
    app.use("/", router);
    const testAgent = supertest(app);

    // ACT
    const response = await testAgent.get("/");

    // ASSERT
    expect(response.statusCode).toEqual(404);
    expect(response.text).toHaveLength(0);
  });

  it("responds with 404 - nested", async () => {
    // ARRANGE
    const router = Router();
    configureAndAttachRoutes(router, {});
    const app = express();
    app.use("/", router);
    const testAgent = supertest(app);

    // ACT
    const response = await testAgent.get("/nested/route");

    // ASSERT
    expect(response.statusCode).toEqual(404);
    expect(response.text).toHaveLength(0);
  });

  it("responds with a custom 404, if provided", async () => {
    // ARRANGE
    const router = Router();

    class CustomController extends BaseController {
      GET(_req: express.Request, res: express.Response): void {
        res.status(404).send("Not found!");
      }
    }

    configureAndAttachRoutes(router, {
      "404": [new CustomController(), "GET"],
    });
    const app = express();
    app.use("/", router);
    const testAgent = supertest(app);

    // ACT
    const response = await testAgent.get("/");

    // ASSERT
    expect(response.statusCode).toEqual(404);
    expect(response.text).toEqual("Not found!");
  });
});

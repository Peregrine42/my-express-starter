import express, { Router } from "express";
import { configureAndAttachRoutes } from "../../../src/lib/getRouter";
import supertest from "supertest";
import { BaseController } from "../../../src/lib/Controller";

describe("when a handler IS defined", () => {
  it("delegates to the handler", async () => {
    // ARRANGE
    const router = Router();
    class TestController extends BaseController {}
    configureAndAttachRoutes(router, {
      "GET /": [TestController, "GET"],
    });
    const app = express();
    app.use("/", router);
    const testAgent = supertest(app);

    // ACT
    const response = await testAgent.get("/");

    // ASSERT
    expect(response.statusCode).toEqual(404);
    expect(response.text).toHaveLength(0);
  });
});

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
      GET = async (_req: express.Request, res: express.Response) => {
        res.status(404).send("Not found!");
      };
    }

    configureAndAttachRoutes(router, {
      "404": [CustomController, "GET"],
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

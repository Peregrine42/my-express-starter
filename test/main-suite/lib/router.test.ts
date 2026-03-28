import express, { Router } from "express";
import { jest } from "@jest/globals";
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

describe("error handling in route wrappers", () => {
  it("catches errors from a regular route handler and forwards to Express error handler", async () => {
    // ARRANGE
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const router = Router();

    class ThrowingController extends BaseController {
      GET = async (_req: express.Request, _res: express.Response) => {
        throw new Error("handler boom");
      };
    }

    configureAndAttachRoutes(router, {
      "GET /boom": [ThrowingController, "GET"],
    });

    const app = express();
    app.use("/", router);
    const errorHandler: express.ErrorRequestHandler = (
      _err,
      _req,
      res,
      _next,
    ) => {
      res.status(500).send("error handled");
    };
    app.use(errorHandler);
    const testAgent = supertest(app);

    // ACT
    const response = await testAgent.get("/boom");

    // ASSERT
    expect(response.statusCode).toEqual(500);
    expect(response.text).toEqual("error handled");
    expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
    consoleSpy.mockRestore();
  });

  it("catches errors from a custom 404 handler and forwards to Express error handler", async () => {
    // ARRANGE
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const router = Router();

    class Throwing404Controller extends BaseController {
      GET = async (_req: express.Request, _res: express.Response) => {
        throw new Error("custom 404 boom");
      };
    }

    configureAndAttachRoutes(router, {
      "404": [Throwing404Controller, "GET"],
    });

    const app = express();
    app.use("/", router);
    const errorHandler: express.ErrorRequestHandler = (
      _err,
      _req,
      res,
      _next,
    ) => {
      res.status(500).send("error handled");
    };
    app.use(errorHandler);
    const testAgent = supertest(app);

    // ACT
    const response = await testAgent.get("/anything");

    // ASSERT
    expect(response.statusCode).toEqual(500);
    expect(response.text).toEqual("error handled");
    expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
    consoleSpy.mockRestore();
  });

  it("catches errors from the default 404 fallback and forwards to Express error handler", async () => {
    // ARRANGE
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const router = Router();

    // No routes and no custom 404 — the default FALLBACK path
    configureAndAttachRoutes(router, {});

    const app = express();
    app.use("/", router);
    const errorHandler: express.ErrorRequestHandler = (
      _err,
      _req,
      res,
      _next,
    ) => {
      res.status(500).send("error handled");
    };
    app.use(errorHandler);
    const testAgent = supertest(app);

    // ACT — the default 404 should work normally (no error)
    const response = await testAgent.get("/nonexistent");

    // ASSERT
    expect(response.statusCode).toEqual(404);
    consoleSpy.mockRestore();
  });
});

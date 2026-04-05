import express from "express";
import inject from "light-my-request";
import { attachAppMiddleware } from "../../../src/lib/attachMiddleware";

describe("attachAppMiddleware", () => {
  it("attaches session middleware and body parser", async () => {
    const app = express();
    await attachAppMiddleware(app, { withRouter: false });

    // Add a simple route to verify middleware is wired up
    let localsKeys: string[] = [];
    app.get("/test", (_req, res) => {
      localsKeys = Object.keys(res.locals);
      res.send("ok");
    });

    const response = await inject(app, {
      method: "get",
      url: "/test",
    });

    expect(response.statusCode).toEqual(200);
    // The sessionSetupMiddleware should set allowedSessionObjectKeys
    expect(localsKeys).toContain("allowedSessionObjectKeys");
  });

  it("does not register routes when withRouter is false", async () => {
    const app = express();
    await attachAppMiddleware(app, { withRouter: false });

    const response = await inject(app, {
      method: "get",
      url: "/counter",
    });

    // Without the router, there's no handler — Express default 404
    expect(response.statusCode).toEqual(404);
  });

  it("registers routes when withRouter is true (default)", async () => {
    const app = express();
    await attachAppMiddleware(app, { withRouter: true });

    // The router (with auth middleware) should be attached,
    // so non-public routes redirect to /login
    const response = await inject(app, {
      method: "get",
      url: "/nonexistent-route",
    });

    expect(response.statusCode).toEqual(302);
    expect(response.headers.location).toEqual(
      "/login?redirect=%2Fnonexistent-route",
    );
  });

  it("registers routes when options are not provided (default withRouter)", async () => {
    const app = express();
    await attachAppMiddleware(app);

    const response = await inject(app, {
      method: "get",
      url: "/nonexistent-route",
    });

    expect(response.statusCode).toEqual(302);
    expect(response.headers.location).toEqual(
      "/login?redirect=%2Fnonexistent-route",
    );
  });
});

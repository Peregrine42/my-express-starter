import { vi } from "vitest";
import express from "express";
import { setupConslLogging } from "../../../src/lib/conslLogging";
import inject from "light-my-request";

describe("setupConslLogging", () => {
  it("adds the Consl object to the response `locals` object", async () => {
    // ARRANGE
    const app = express();
    const [consl, conslMiddleware] = setupConslLogging();
    app.use(conslMiddleware);
    let found = undefined;
    app.get("/", (_req, res) => {
      found = res.locals.consl;
      res.send("Logged");
    });

    // ACT
    await inject(app, {
      method: "get",
      url: "/",
    });

    // ASSERT
    expect(found).toEqual(consl);
  });

  it("optionally adds a reqId for tracing", async () => {
    // ARRANGE
    const app = express();
    const [_consl, conslMiddleware] = setupConslLogging({ addReqId: true });
    app.use(conslMiddleware);
    let found = undefined;
    app.get("/", (_req, res) => {
      found = res.locals.reqId;
      res.send("ReqId added");
    });

    // ACT
    await inject(app, {
      method: "get",
      url: "/",
    });

    // ASSERT
    expect(typeof found).toEqual("string");
  });
});

describe("log", () => {
  it("takes a payload acceptable by console.error", () => {
    // ARRANGE
    const [consl] = setupConslLogging({
      consoleOverride: { error: vi.fn() },
    });

    const e = new Error("Oops!");

    // ACT + ASSERT
    expect(consl("error", e)).toEqual(["ERROR", e]);
  });

  it("can optionally take the request object to give more context", () => {
    // ARRANGE
    const [consl] = setupConslLogging({
      consoleOverride: { log: vi.fn() },
    });

    // ACT + ASSERT
    expect(
      consl(
        "log",
        { method: "get", url: "/hi-there" }, // req
      ),
    ).toEqual(["LOG", "GET", "/hi-there"]);
  });

  it("can optionally take a request ID to trace response logging to a particular request", () => {
    // ARRANGE
    const [consl] = setupConslLogging({
      consoleOverride: { error: vi.fn(), log: vi.fn() },
    });

    // ACT + ASSERT
    expect(
      consl(
        "log",
        { locals: { reqId: "abc" } }, // res
      ),
    ).toEqual(["reqId:abc", "LOG"]);

    // ACT + ASSERT
    expect(
      consl(
        "error",
        { method: "get", url: "/hi-there" }, // req
        { locals: { reqId: "def" } }, // res
      ),
    ).toEqual(["reqId:def", "ERROR", "GET", "/hi-there"]);
  });

  it("just logs to the console", () => {
    // ARRANGE
    const [consl] = setupConslLogging({
      consoleOverride: { log: vi.fn() },
    });

    // ACT + ASSERT
    expect(consl("log", "foo")).toEqual(["LOG", "foo"]);
  });
});

import express from "express";
import { consl, setupConslLogging } from "../../../src/lib/conslLogging";
import inject from "light-my-request";

describe("setupConslLogging", () => {
  it("adds the base Console object to the response `locals` object", async () => {
    // ARRANGE
    const app = express();
    app.use(setupConslLogging());
    let found = undefined;
    app.get("/", (_req, res) => {
      found = res.locals.console;
      res.send("Logged");
    });

    // ACT
    await inject(app, {
      method: "get",
      url: "/",
    });

    // ASSERT
    expect(found).toEqual(console);
  });

  it("adds a custom log object to the response `locals` object", async () => {
    // ARRANGE
    const ourConsole = { error: jest.fn() };
    const app = express();
    app.use(setupConslLogging({ console: ourConsole }));
    let found = undefined;
    app.get("/", (_req, res) => {
      found = res.locals.console;
      res.send("Logged");
    });

    // ACT
    await inject(app, {
      method: "get",
      url: "/",
    });

    // ASSERT
    expect(found).toEqual(ourConsole);
  });

  it("optionally adds a reqId for tracing", async () => {
    // ARRANGE
    const app = express();
    app.use(setupConslLogging({ addReqId: true }));
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
    const e = new Error("Oops!");
    jest.spyOn(console, "error").mockImplementation(() => {});

    // ACT + ASSERT
    expect(consl("error", e)).toEqual(["ERROR", e]);
  });

  it("introspects the response for a `locals` object", () => {
    // ARRANGE + ACT + ASSERT
    expect(
      consl("error", { locals: { console: { error: jest.fn() } } }),
    ).toEqual(["ERROR"]);
  });

  it("can optionally take the request object to give more context", () => {
    // ARRANGE + ACT + ASSERT
    expect(
      consl(
        "log",
        { method: "get", url: "/hi-there" }, // req
        { locals: { console: { log: jest.fn() } } }, // res
      ),
    ).toEqual(["LOG", "GET", "/hi-there"]);
  });

  it("can optionally take a request ID to trace response logging to a particular request", () => {
    // ARRANGE + ACT + ASSERT
    expect(
      consl(
        "log",
        { locals: { console: { log: jest.fn() }, reqId: "abc" } }, // res
      ),
    ).toEqual(["reqId:abc", "LOG"]);

    // ARRANGE + ACT + ASSERT
    expect(
      consl(
        "error",
        { method: "get", url: "/hi-there" }, // req
        { locals: { reqId: "def", console: { error: jest.fn() } } }, // res
      ),
    ).toEqual(["reqId:def", "ERROR", "GET", "/hi-there"]);
  });

  it("just logs to the console", () => {
    // ARRANGE
    jest.spyOn(console, "log").mockImplementation(() => {});

    // ACT + ASSERT
    expect(consl("log", "foo")).toEqual(["LOG", "foo"]);
  });

  afterEach(() => {
    // @ts-expect-error Mock
    if (console?.log?.mockClear) {
      // @ts-expect-error Mock
      console.log.mockClear();
    }
    // @ts-expect-error Mock
    if (console?.error?.mockClear) {
      // @ts-expect-error Mock
      console.error.mockClear();
    }
  });
});

import { SessionCounter } from "../../src/controllers/SessionCounter";
import {} from // getHTMLDocumentBody,
// setupController,
"./lib/setupController";
// import { getByTestId } from "@testing-library/dom";
import { Cookie } from "tough-cookie";
import Redis from "ioredis";
import {
  getStringValueFromSession,
  SessionReq,
  SessionRes,
  setupSession, // setStringValueFromSession,
  // setupSession,
} from "../../src/lib/session";
import { setupMyController } from "../setupMyController";

const existingSessionId = "foo";
const allowedSessionObjectKeys = ["counter"];

describe("the counter", () => {
  beforeEach(async () => {
    const redis = new Redis({ keyPrefix: "session:counter:" });

    try {
      await redis.del(existingSessionId);
    } finally {
      redis.disconnect();
    }

    const redis2 = new Redis({ keyPrefix: "session::" });

    try {
      await redis2.del(existingSessionId);
    } finally {
      redis2.disconnect();
    }
  });

  it("throws an error when accessed without a session", async () => {
    // ARRANGE
    const [dispatch] = await setupMyController([SessionCounter, "GET"]);

    // ACT / ASSERT
    expect(async () => await dispatch()).rejects.toThrow("No session!");
  });

  it("renders the counter view", async () => {
    // ARRANGE
    const cookieString = new Cookie({
      value: existingSessionId,
      key: "session",
      path: "/",
    }).cookieString();

    await setupSession(
      { cookies: { session: existingSessionId } },
      { locals: { allowedSessionObjectKeys } },
      existingSessionId,
    );

    const [dispatch] = await setupMyController([SessionCounter, "GET"]);

    // ACT
    const [_req, res] = await dispatch({
      headers: {
        cookie: cookieString,
      },
    });

    // ASSERT
    expect(res.recording[0].method).toEqual("render");
    expect(res.recording[0].args[0]).toEqual("counter");
  });

  it("throws when given a missing session", async () => {
    // ARRANGE
    const cookieString = new Cookie({
      value: existingSessionId,
      key: "session",
      path: "/",
    }).cookieString();

    const [dispatch] = await setupMyController([SessionCounter, "GET"]);

    // ACT
    await expect(async () => {
      await dispatch({
        headers: {
          cookie: cookieString,
        },
      });
    }).rejects.toThrow("No session!");
  });

  it("can increment the value stored in Redis", async () => {
    // ARRANGE
    const cookieString = new Cookie({
      value: existingSessionId,
      key: "session",
    }).cookieString();

    await setupSession(
      { cookies: { session: existingSessionId } },
      { locals: { allowedSessionObjectKeys } },
      existingSessionId,
    );

    const [dispatch] = await setupMyController([SessionCounter, "POST"]);

    // ACT
    await dispatch({
      method: "POST",
      headers: {
        cookie: cookieString,
      },
    });

    const [req, res] = await dispatch({
      method: "POST",
      headers: {
        cookie: cookieString,
      },
    });

    // ASSERT
    const val2 = await getStringValueFromSession(
      req as SessionReq,
      res as SessionRes,
      "counter",
    );

    expect(val2).toEqual("2");
  });

  it("can decrement the value stored in Redis", async () => {
    // ARRANGE
    const cookieString = new Cookie({
      value: existingSessionId,
      key: "session",
    }).cookieString();

    await setupSession(
      { cookies: { session: existingSessionId } },
      { locals: { allowedSessionObjectKeys } },
      existingSessionId,
    );

    const [dispatch] = await setupMyController([SessionCounter, "DELETE"]);

    // ACT
    await dispatch({
      method: "DELETE",
      headers: {
        cookie: cookieString,
      },
    });

    const [req, res] = await dispatch({
      method: "DELETE",
      headers: {
        cookie: cookieString,
      },
    });

    // ASSERT
    const val = await getStringValueFromSession(
      req as SessionReq,
      res as SessionRes,
      "counter",
    );

    expect(val).toEqual("-2");
  });
});

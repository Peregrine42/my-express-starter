import { SessionCounter } from "../../src/controllers/SessionCounter";
import { setupController } from "../helpers";
import { Window } from "happy-dom";
import { getByTestId } from "@testing-library/dom";
import { Cookie } from "tough-cookie";
import Redis from "ioredis";

describe("the counter", () => {
  beforeEach(async () => {
    const redis = new Redis({ keyPrefix: "session:counter:" });

    try {
      await redis.del("foo");
    } finally {
      redis.disconnect();
    }
  });

  it("has a '+' button", async () => {
    // ARRANGE
    const [dispatch] = await setupController("GET /counter", [
      SessionCounter,
      "GET",
    ]);

    // ACT
    const resp = await dispatch();

    // ASSERT
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toContain("+");
    expect(resp.cookies).toContainEqual(
      expect.objectContaining({
        name: "session",
        value: expect.stringMatching(/.+/),
        path: "/",
      }),
    );
  });

  it("renders a value stored in session", async () => {
    // ARRANGE
    const cookieString = new Cookie({
      value: "foo",
      key: "session",
      path: "/",
    }).cookieString();

    const redis = new Redis({ keyPrefix: "session:counter:" });

    try {
      await redis.set("foo", "41");
    } finally {
      redis.disconnect();
    }

    const [dispatch] = await setupController("GET /counter", [
      SessionCounter,
      "GET",
    ]);

    // ACT
    const resp = await dispatch({
      headers: {
        cookie: cookieString,
      },
    });

    // ASSERT
    expect(resp.statusCode).toEqual(200);
    const documentBody = getHTMLDocumentBody(resp.body);
    expect(getByTestId(documentBody, "counter-value")).toHaveTextContent("41");
    expect(resp.cookies).toContainEqual(
      expect.objectContaining({
        name: "session",
        value: "foo",
        path: "/",
      }),
    );
  });

  it("resets to 0 a missing session", async () => {
    // ARRANGE
    const cookieString = new Cookie({
      value: "foo",
      key: "session",
      path: "/",
    }).cookieString();

    const [dispatch] = await setupController("GET /counter", [
      SessionCounter,
      "GET",
    ]);

    // ACT
    const resp = await dispatch({
      headers: {
        cookie: cookieString,
      },
    });

    // ASSERT
    expect(resp.statusCode).toEqual(200);
    const documentBody = getHTMLDocumentBody(resp.body);
    expect(getByTestId(documentBody, "counter-value")).toHaveTextContent("0");
    expect(resp.cookies).toContainEqual(
      expect.objectContaining({
        name: "session",
        value: "foo",
        path: "/",
      }),
    );
  });

  it("can increment", async () => {
    // ARRANGE
    const cookieString = new Cookie({
      value: "foo",
      key: "session",
    }).cookieString();

    const [dispatch] = await setupController("POST /counter", [
      SessionCounter,
      "POST",
    ]);

    // ACT
    const resp = await dispatch({
      headers: {
        cookie: cookieString,
      },
    });

    // ASSERT
    expect(resp.statusCode).toEqual(200);
    const documentBody = getHTMLDocumentBody(resp.body);
    expect(getByTestId(documentBody, "counter-value")).toHaveTextContent("1");

    // ACT
    const resp2 = await dispatch({
      headers: {
        cookie: cookieString,
      },
    });

    // ASSERT
    expect(resp2.statusCode).toEqual(200);
    const documentBody2 = getHTMLDocumentBody(resp2.body);
    expect(getByTestId(documentBody2, "counter-value")).toHaveTextContent("2");
  });
});

const getHTMLDocumentBody = (body: string) => {
  const window = new Window();
  const document = window.document;
  document.body.innerHTML = body;
  return document.body as unknown as HTMLElement;
};

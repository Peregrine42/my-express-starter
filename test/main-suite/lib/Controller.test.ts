import { BaseController } from "../../../src/lib/Controller";
import inject from "light-my-request";
import express from "express";
import _ from "lodash";

const methods = [
  "GET",
  "POST",
  "PATCH",
  "PUT",
  "OPTIONS",
  "HEAD",
  "DELETE",
] as const;
const lowercaseMethods = [
  "get",
  "post",
  "patch",
  "put",
  "options",
  "head",
  "delete",
] as const;

type Methods = (typeof methods)[number];
type LowercaseMethods = (typeof lowercaseMethods)[number];

_.zip(methods, lowercaseMethods).forEach(([method, lowercaseMethod]) => {
  describe("Call the fallback (404)", () => {
    it(`for ${method}`, async () => {
      // ARRANGE
      const testController = new BaseController();
      const server = express();
      server[lowercaseMethod as LowercaseMethods]("/", (req, res) => {
        testController[method as Methods](req, res);
      });

      // ACT
      const resp = await inject(server, {
        method: lowercaseMethod,
        url: "/",
      });

      // ASSERT
      expect(resp.statusCode).toEqual(404);
    });
  });
});

describe("BaseController FALLBACK", () => {
  it("throws when given a non-express response", async () => {
    const controller = new BaseController();
    await expect(
      controller.FALLBACK(
        {} as typeof express.request,
        {} as typeof express.response,
      ),
    ).rejects.toThrow();
  });

  it("sends 404 with empty body when given an express response", async () => {
    // ARRANGE
    const testController = new BaseController();
    const server = express();
    server.get("/", (req, res) => {
      testController.GET(req, res);
    });

    // ACT
    const resp = await inject(server, { method: "get", url: "/" });

    // ASSERT
    expect(resp.statusCode).toEqual(404);
    expect(resp.body).toEqual("");
  });
});

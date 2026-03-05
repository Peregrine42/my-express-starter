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
      const testController = new BaseController();
      const server = express();
      server[lowercaseMethod as LowercaseMethods]("/", (req, res) => {
        testController[method as Methods](req, res);
      });
      const resp = await inject(server, {
        method: lowercaseMethod,
        url: "/",
      });
      expect(resp.statusCode).toEqual(404);
    });
  });
});

import { jest } from "@jest/globals";
import express from "express";
import { BaseController, isRes, isReq } from "../../../src/lib/Controller";

describe("isRes", () => {
  it("returns true for express.response", () => {
    expect(isRes(express.response)).toEqual(true);
  });

  it("returns false for a plain object", () => {
    const fakeRes = { status: function () {} } as unknown;
    expect(isRes(fakeRes as Partial<typeof express.response>)).toEqual(false);
  });
});

describe("isReq", () => {
  it("returns true for express.request", () => {
    expect(isReq(express.request)).toEqual(true);
  });

  it("returns false for a plain object", () => {
    const fakeReq = { headers: {} };
    expect(isReq(fakeReq as Partial<typeof express.request>)).toEqual(false);
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

  it("sends 404 when given an express response", async () => {
    const controller = new BaseController();
    const res = express.response;
    const sendSpy = jest.spyOn(res, "send").mockImplementation(() => {
      return {} as ReturnType<typeof res.send>;
    });

    try {
      await controller.FALLBACK(express.request, res);
      expect(sendSpy).toHaveBeenCalledWith("");
    } finally {
      sendSpy.mockRestore();
    }
  });
});

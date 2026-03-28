import express from "express";
import { isRes, isReq } from "../../../src/lib/Controller";

describe("isRes", () => {
  it("returns true for express.response", () => {
    // ARRANGE
    const res = express.response;
    // ACT
    const result = isRes(res);
    // ASSERT
    expect(result).toEqual(true);
  });

  it("returns false for a plain object", () => {
    // ARRANGE
    const fakeRes = { status: function () {} } as unknown;
    // ACT
    const result = isRes(fakeRes as Partial<typeof express.response>);
    // ASSERT
    expect(result).toEqual(false);
  });
});

describe("isReq", () => {
  it("returns true for express.request", () => {
    // ARRANGE
    const req = express.request;
    // ACT
    const result = isReq(req);
    // ASSERT
    expect(result).toEqual(true);
  });

  it("returns false for a plain object", () => {
    // ARRANGE
    const fakeReq = { headers: {} };
    // ACT
    const result = isReq(fakeReq as Partial<typeof express.request>);
    // ASSERT
    expect(result).toEqual(false);
  });
});

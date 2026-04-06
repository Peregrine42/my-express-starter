import express from "express";
import { describe, it, expect, vi } from "vitest";
import { checkLogin } from "../../../src/lib/attachMiddleware";

vi.mock("../../../src/lib/session", () => {
  return {
    hasSession: vi.fn().mockRejectedValue(new Error("No session!")),
  };
});

describe("checkLogin", () => {
  it("returns false when hasSession throws", async () => {
    const req = { cookies: {} } as unknown as express.Request;
    const res = { locals: {} } as unknown as express.Response;
    const result = await checkLogin(req, res);

    expect(result).toBe(false);
  });
});

import { Home } from "../../src/controllers/Home";
import { wasCalledWith } from "./lib/RecordingProxy";
import { setupController } from "./lib/setupController";
import express from "express";

describe("the homepage controller", () => {
  it("renders the homepage", async () => {
    // ARRANGE
    const [dispatch] = await setupController([Home, "GET"]);
    // ACT
    const [_req, res] = await dispatch();
    // ASSERT
    expect(res.statusCode).toEqual(200);
    expect(
      wasCalledWith<express.Response>(res, "render", "index"),
    ).toBeTruthy();
  });
});

import { SessionCounter } from "../../src/controllers/SessionCounter";
import { setupController } from "../helpers";

describe("the counter", () => {
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
  });

  it("has a '+' button", async () => {
    // ARRANGE
    const [dispatch] = await setupController("POST /counter", [
      SessionCounter,
      "POST",
    ]);

    // ACT
    const resp = await dispatch();

    // ASSERT
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toContain("+");
  });
});

import { Home } from "../../src/controllers/Home";
import { setupController } from "../helpers";

describe("the homepage", () => {
  it("has a welcome message in the title bar", async () => {
    // ARRANGE
    const [dispatch] = await setupController("GET /", [Home, "GET"]);

    // ACT
    const resp = await dispatch();

    // ASSERT
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toContain("<title>My App - Welcome</title>");
  });
});

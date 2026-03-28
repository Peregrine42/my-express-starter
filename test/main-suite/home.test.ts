import { Home } from "../../src/controllers/Home";
import { wasCalledWith } from "./lib/RecordingProxy";
import { setupController } from "./lib/setupController";

describe("the homepage controller", () => {
  it("renders the homepage", async () => {
    // ARRANGE
    const [dispatch] = await setupController([Home, "GET"]);
    // ACT
    const { res, response } = await dispatch();
    // ASSERT
    expect(response.statusCode).toEqual(200);
    wasCalledWith(res, "render", "index");
  });
});

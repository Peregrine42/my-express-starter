import { Home } from "../../src/controllers/Home";
import { wasCalledWith } from "./lib/RecordingProxy";
import { setupController } from "./lib/setupController";

describe("the homepage controller", () => {
  it("renders the homepage", async () => {
    const [dispatch] = await setupController([Home, "GET"]);
    const { res, response } = await dispatch();
    expect(response.statusCode).toEqual(200);
    wasCalledWith(res, "render", "index");
  });
});

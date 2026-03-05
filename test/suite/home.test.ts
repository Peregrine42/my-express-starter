import inject from "light-my-request";
import _ from "lodash";
import { Home } from "../../src/controllers/home";
import { getApp } from "../../src/lib/getApp";

describe("the homepage", () => {
  it("has a welcome message in title", async () => {
    const controllerUnderTest = new Home();
    const server = await getApp({
      withApp: async (app) => {
        app.get("/", (req, res) => {
          controllerUnderTest.GET(req, res);
        });
      },
    });

    const resp = await inject(server, {
      method: "get",
      url: "/",
    });
    expect(resp.statusCode).toEqual(200);
  });
});

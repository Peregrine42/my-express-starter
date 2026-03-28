import { getMyRoutes } from "../../../src/getMyRoutes";

describe("getMyRoutes", () => {
  it("returns the expected route configuration", () => {
    const routes = getMyRoutes();

    expect(Object.keys(routes)).toEqual([
      "GET /",
      "GET /counter",
      "POST /counter",
      "DELETE /counter",
    ]);

    // Spot-check the home route
    expect(routes["GET /"][1]).toEqual("GET");

    // Spot-check the counter GET route
    expect(routes["GET /counter"][1]).toEqual("GET");
    expect(routes["POST /counter"][1]).toEqual("POST");
    expect(routes["DELETE /counter"][1]).toEqual("DELETE");
  });
});

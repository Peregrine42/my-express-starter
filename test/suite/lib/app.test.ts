import supertest from "supertest";
import { getMyApp } from "../../../src/getMyApp";

describe("App", () => {
  it("can serve static files", async () => {
    // ARRANGE
    const app = await getMyApp();
    const testAgent = supertest(app);

    // ACT
    const response = await testAgent.get("/public/favicon.ico");

    // ASSERT
    expect(response.statusCode).toEqual(200);
    expect(response.body?.length).toBeGreaterThan(0);
  });
});

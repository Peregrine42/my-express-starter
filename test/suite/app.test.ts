import supertest from "supertest";
import { getMyApp } from "../../src/getMyApp";

describe("App", () => {
  it("can serve static files", async () => {
    const app = await getMyApp();
    const testAgent = supertest(app);
    const response = await testAgent.get("/public/favicon.ico");
    expect(response.statusCode).toEqual(200);
    expect(response.body?.length).toBeGreaterThan(0);
  });
});

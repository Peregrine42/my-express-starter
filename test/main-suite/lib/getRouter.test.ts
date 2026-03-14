import { getRouter } from "../../../src/lib/getRouter";

describe("Building a router", () => {
  it("returns an ExpressJS router", async () => {
    const router = await getRouter({});

    expect(router.get).toBeDefined();
    expect(router.post).toBeDefined();
    expect(router.put).toBeDefined();
    expect(router.patch).toBeDefined();
    expect(router.head).toBeDefined();
    expect(router.options).toBeDefined();
    expect(router.delete).toBeDefined();
  });
});

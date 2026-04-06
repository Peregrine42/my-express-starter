import { getPool, closePool } from "../../../src/lib/db";

describe("db", () => {
  afterEach(async () => {
    await closePool();
  });

  it("getPool returns a Pool instance", () => {
    const pool = getPool();
    expect(pool).toBeDefined();
    expect(typeof pool.query).toEqual("function");
  });

  it("getPool returns the same instance on subsequent calls", () => {
    const pool1 = getPool();
    const pool2 = getPool();
    expect(pool1).toBe(pool2);
  });
});

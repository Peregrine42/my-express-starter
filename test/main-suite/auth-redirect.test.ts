import { isSafeRedirect } from "../../src/lib/auth";

describe("isSafeRedirect", () => {
  it("allows relative paths starting with /", () => {
    expect(isSafeRedirect("/counter")).toBe(true);
    expect(isSafeRedirect("/")).toBe(true);
    expect(isSafeRedirect("/some/path?query=1")).toBe(true);
  });

  it("rejects protocol-relative URLs starting with //", () => {
    expect(isSafeRedirect("//evil.com")).toBe(false);
    expect(isSafeRedirect("//evil.com/steal")).toBe(false);
  });

  it("rejects non-path URLs", () => {
    expect(isSafeRedirect("http://evil.com")).toBe(false);
    expect(isSafeRedirect("https://evil.com")).toBe(false);
  });
});

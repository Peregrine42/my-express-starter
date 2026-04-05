import { E2E_SESSION_ID } from "./globalSetup";
import { env } from "../../src/env";

describe("A full e2e test", (): void => {
  beforeAll(async () => {
    // Set the session cookie so the pages can authenticate
    await page.context().addCookies([
      {
        name: "session",
        value: E2E_SESSION_ID,
        domain: process.env.COOKIE_DOMAIN || "localhost",
        path: "/",
      },
    ]);
  });

  it("renders the homepage when logged in", async (): Promise<void> => {
    await page.goto(`http://localhost:${env.PORT}`);
    const content = await page.content();
    expect(content).toMatch(/Hello, from React!/);
  });

  it("redirects to /login when not authenticated", async (): Promise<void> => {
    const browserContext = await browser.newContext();
    try {
      const newPage = await browserContext.newPage();
      await newPage.goto(`http://localhost:${env.PORT}/counter`);
      await newPage.waitForURL("**/login**", { timeout: 5000 });
      const content = await newPage.content();
      expect(content).toMatch(/Login/);
    } finally {
      await browserContext.close();
    }
  });
});

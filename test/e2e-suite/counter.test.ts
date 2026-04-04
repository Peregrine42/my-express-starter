import { E2E_SESSION_ID } from "./globalSetup";
import { env } from "../../src/env";

const getCounterValue = async () => {
  return page.locator('[data-testid="counter-value"]').textContent();
};

describe("counter e2e", (): void => {
  beforeAll(async () => {
    // Set the session cookie so the counter page can authenticate
    await page.context().addCookies([
      {
        name: "session",
        value: E2E_SESSION_ID,
        domain: process.env.COOKIE_DOMAIN || "localhost",
        path: "/",
      },
    ]);
  });

  it("should increment and then decrement the counter via _method=delete", async (): Promise<void> => {
    await page.goto(`http://localhost:${env.PORT}/counter`);

    // Initial value is 0
    expect(await getCounterValue()).toBe("0");

    // Click "+" twice to increment
    const incrementButton = () => {
      return page.locator('input[type="submit"][value="+"]');
    };
    await incrementButton().click();
    await page.waitForLoadState("networkidle");
    expect(await getCounterValue()).toBe("1");

    await incrementButton().click();
    await page.waitForLoadState("networkidle");
    expect(await getCounterValue()).toBe("2");

    // Click "−" to decrement via _method=delete form
    const decrementButton = () => {
      return page.locator('input[type="submit"][value="−"]');
    };
    await decrementButton().click();
    await page.waitForLoadState("networkidle");
    expect(await getCounterValue()).toBe("1");

    // Decrement again
    await decrementButton().click();
    await page.waitForLoadState("networkidle");
    expect(await getCounterValue()).toBe("0");
  });
});

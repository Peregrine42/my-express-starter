import "jest-puppeteer";
import "expect-puppeteer";
import { env } from "../../src/env";
import { E2E_SESSION_ID } from "./globalSetup";

const getCounterValue = async () => {
  return page.$eval('[data-testid="counter-value"]', (el) => {
    return el.textContent ?? "";
  });
};

describe("counter e2e", (): void => {
  beforeAll(async () => {
    // Set the session cookie so the counter page can authenticate
    await browser.setCookie({
      name: "session",
      value: E2E_SESSION_ID,
      domain: process.env.COOKIE_DOMAIN || "localhost",
      path: "/",
    });
  });

  it("should increment and then decrement the counter via _method=delete", async (): Promise<void> => {
    await page.goto(`http://localhost:${env.PORT}/counter`);

    // Initial value is 0
    expect(await getCounterValue()).toBe("0");

    // Click "+" twice to increment
    const incrementButton = () => {
      return page.$('input[type="submit"][value="+"]');
    };
    await (await incrementButton())!.click();
    await page.waitForNetworkIdle();
    expect(await getCounterValue()).toBe("1");

    await (await incrementButton())!.click();
    await page.waitForNetworkIdle();
    expect(await getCounterValue()).toBe("2");

    // Click "−" to decrement via _method=delete form
    const decrementButton = () => {
      return page.$('input[type="submit"][value="−"]');
    };
    await (await decrementButton())!.click();
    await page.waitForNetworkIdle();
    expect(await getCounterValue()).toBe("1");

    // Decrement again
    await (await decrementButton())!.click();
    await page.waitForNetworkIdle();
    expect(await getCounterValue()).toBe("0");
  });
});

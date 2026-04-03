import { env } from "../../src/env";

describe("A full e2e test", (): void => {
  it('should display "Welcome" text on page', async (): Promise<void> => {
    await page.goto(`http://localhost:${env.PORT}`);
    const content = await page.content();
    expect(content).toMatch(/Hello, from React!/);
  });
});

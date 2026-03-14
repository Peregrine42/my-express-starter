import "jest-puppeteer";
import "expect-puppeteer";
import { env } from "../../src/env";
import { getApp, ShutdownApp } from "../../src/lib/getApp";
import { getMyRoutes } from "../../src/getMyRoutes";
import { getRouter } from "../../src/lib/getRouter";

describe("A full e2e test", (): void => {
  const appOpts = {
    consoleOverride: {
      log: jest.fn(),
    },
  };
  let appShutdown: ShutdownApp | undefined = undefined;

  beforeAll(async () => {
    const routes = getMyRoutes();
    const myRouter = await getRouter(routes);

    const [app, appStartup] = await getApp(appOpts);
    app.use(myRouter);
    appShutdown = await appStartup();
  });

  afterAll(async () => {
    await appShutdown?.();
  });

  it('should display "Welcome" text on page', async (): Promise<void> => {
    expect(appOpts.consoleOverride.log).toHaveBeenCalledWith(
      `LOG App is listening at http://localhost:${env.PORT}`,
    );
    await page.goto(`http://localhost:${env.PORT}`);
    await expect(page).toMatchTextContent(/Hello, from React!/);
  });
});

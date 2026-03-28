import Redis from "ioredis";
import { getApp, ShutdownApp } from "../../src/lib/getApp";
import { attachAppMiddleware } from "../../src/lib/attachMiddleware";

export const E2E_SESSION_ID = "e2e-test-session";

declare global {
  var appShutdown: ShutdownApp;
}

export default async function globalSetup(jestConfig: {
  maxWorkers?: number | string;
  watch?: boolean;
  watchAll?: boolean;
  rootDir?: string;
}) {
  // Seed a session in Redis so the counter page can authenticate
  const sessionRedis = new Redis({ keyPrefix: "session::" });
  try {
    await sessionRedis.set(E2E_SESSION_ID, "present");
  } finally {
    sessionRedis.disconnect();
  }
  // Clean any stale counter value from previous runs
  const counterRedis = new Redis({ keyPrefix: "session:counter:" });
  try {
    await counterRedis.del(E2E_SESSION_ID);
  } finally {
    counterRedis.disconnect();
  }
  // Start the app server
  const [app, appStartup] = await getApp({
    consoleOverride: {
      log: () => {},
    },
  });
  await attachAppMiddleware(app);
  global.appShutdown = await appStartup();

  // Launch the browser via jest-puppeteer's setup
  const setup = require("jest-environment-puppeteer/setup");
  await setup(jestConfig);
}

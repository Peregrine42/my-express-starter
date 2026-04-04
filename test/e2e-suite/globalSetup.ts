import type { TestProject } from "vitest/node";
import Redis from "ioredis";
import { chromium, type BrowserServer } from "playwright";
import { getApp, type ShutdownApp } from "../../src/lib/getApp";
import { attachAppMiddleware } from "../../src/lib/attachMiddleware";

const E2E_SESSION_ID = "e2e-test-session";

export default function setup(project: TestProject) {
  let appShutdown: ShutdownApp;
  let browserServer: BrowserServer;

  project.onTestsRerun(async () => {
    // Restart server and browser on test reruns
    await browserServer.close();
    await appShutdown();
    await startServerAndBrowser(project);
  });

  async function startServerAndBrowser(project: TestProject) {
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
    appShutdown = await appStartup();

    // Launch the browser server
    browserServer = await chromium.launchServer();
    project.provide("wsEndpoint", browserServer.wsEndpoint());
  }

  // Initial setup
  return startServerAndBrowser(project).then(async () => {
    return async () => {
      await appShutdown();
      await browserServer.close();

      // Clean up the seeded session and counter
      const teardownSessionRedis = new Redis({ keyPrefix: "session::" });
      try {
        await teardownSessionRedis.del(E2E_SESSION_ID);
      } finally {
        teardownSessionRedis.disconnect();
      }
      const teardownCounterRedis = new Redis({ keyPrefix: "session:counter:" });
      try {
        await teardownCounterRedis.del(E2E_SESSION_ID);
      } finally {
        teardownCounterRedis.disconnect();
      }
    };
  });
}

declare module "vitest" {
  export interface ProvidedContext {
    wsEndpoint: string;
  }
}

export { E2E_SESSION_ID };

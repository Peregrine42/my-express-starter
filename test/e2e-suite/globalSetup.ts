import type { TestProject } from "vitest/node";
import Redis from "ioredis";
import { chromium, type BrowserServer } from "playwright";
import { getApp, type ShutdownApp } from "../../src/lib/getApp";
import { closePool } from "../../src/lib/db";
import { attachAppMiddleware } from "../../src/lib/attachMiddleware";
import { getPool } from "../../src/lib/db";

const E2E_SESSION_ID = "e2e-test-session";
const E2E_USERNAME = "e2e-test-user";

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
    const pool = getPool();

    // Seed a user in Postgres for E2E tests
    const userResult = await pool.query(
      `INSERT INTO users (username) VALUES ($1)
       ON CONFLICT (username) DO NOTHING
       RETURNING id`,
      [E2E_USERNAME],
    );
    const userId =
      userResult.rows.length > 0
        ? userResult.rows[0].id
        : (
            await pool.query(`SELECT id FROM users WHERE username = $1`, [
              E2E_USERNAME,
            ])
          ).rows[0].id;

    // Clean any stale counter for this user
    await pool.query(`DELETE FROM counters WHERE user_id = $1`, [userId]);

    // Seed a session in Redis with user_id
    const sessionRedis = new Redis({ keyPrefix: "session::" });
    try {
      await sessionRedis.set(E2E_SESSION_ID, "present");
    } finally {
      sessionRedis.disconnect();
    }
    const userIdRedis = new Redis({ keyPrefix: "session:user_id:" });
    try {
      await userIdRedis.set(E2E_SESSION_ID, String(userId));
    } finally {
      userIdRedis.disconnect();
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
      const teardownUserIdRedis = new Redis({ keyPrefix: "session:user_id:" });
      try {
        await teardownUserIdRedis.del(E2E_SESSION_ID);
      } finally {
        teardownUserIdRedis.disconnect();
      }

      // Clean up the E2E user and counter from Postgres
      const pool = getPool();
      const userResult = await pool.query(
        `SELECT id FROM users WHERE username = $1`,
        [E2E_USERNAME],
      );
      if (userResult.rows.length > 0) {
        await pool.query(`DELETE FROM counters WHERE user_id = $1`, [
          userResult.rows[0].id,
        ]);
        await pool.query(`DELETE FROM users WHERE id = $1`, [
          userResult.rows[0].id,
        ]);
      }

      await closePool();
    };
  });
}

declare module "vitest" {
  export interface ProvidedContext {
    wsEndpoint: string;
  }
}

export { E2E_SESSION_ID };

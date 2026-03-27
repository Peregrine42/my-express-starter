import Redis from "ioredis";
import { E2E_SESSION_ID } from "./globalSetup";

export default async function globalTeardown(jestConfig: {
  watch?: boolean;
  watchAll?: boolean;
}) {
  const teardown = require("jest-environment-puppeteer/teardown");
  await teardown(jestConfig);
  await global?.appShutdown?.();

  // Clean up the seeded session and counter
  const sessionRedis = new Redis({ keyPrefix: "session::" });

  try {
    await sessionRedis.del(E2E_SESSION_ID);
  } finally {
    sessionRedis.disconnect();
  }
  const counterRedis = new Redis({ keyPrefix: "session:counter:" });
  try {
    await counterRedis.del(E2E_SESSION_ID);
  } finally {
    counterRedis.disconnect();
  }
}

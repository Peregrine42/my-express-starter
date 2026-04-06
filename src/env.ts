export const envVarNames = [
  "PORT",
  "NODE_ENV",
  "REDIS_URL",
  "SESSION_SECRET",
  "COOKIE_DOMAIN",
  "DATABASE_URL",
  "INITIAL_USER_USERNAME",
  "INITIAL_USER_PASSWORD",
] as const;
export type EnvVars = (typeof envVarNames)[number];
export const env = process.env as Record<EnvVars, string>;

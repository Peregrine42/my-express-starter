const main = {
  displayName: "main",
  testMatch: ["<rootDir>/dist/main-suite/**/*.test.mjs"],
  coveragePathIgnorePatterns: [
    "node_modules",
    "<rootDir>/dist/_virtual/_rolldown/runtime.mjs",
  ],
  setupFilesAfterEnv: ["<rootDir>/dist/setupTests.mjs"],
  transform: {},
};

const e2e = {
  displayName: "e2e",
  preset: "jest-puppeteer",
  testMatch: ["<rootDir>/dist/e2e-suite/**/*.test.mjs"],
  coveragePathIgnorePatterns: [".*"],
  setupFilesAfterEnv: ["<rootDir>/dist/setupTests.mjs"],
};

const config = {
  collectCoverage: true,
  projects: [main, e2e],
};

module.exports = config;

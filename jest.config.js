const main = {
  displayName: "main",
  testMatch: ["<rootDir>/dist/main-suite/**/*.test.cjs"],
  coveragePathIgnorePatterns: [
    "node_modules",
    "<rootDir>/dist/_virtual/_rolldown/runtime.cjs",
  ],
  setupFilesAfterEnv: ["<rootDir>/dist/setupTests.cjs"],
  transform: {},
};

const e2e = {
  displayName: "e2e",
  preset: "jest-puppeteer",
  testMatch: ["<rootDir>/dist/e2e-suite/**/*.test.cjs"],
  coveragePathIgnorePatterns: [".*"],
  setupFilesAfterEnv: ["<rootDir>/dist/setupTests.cjs"],
  transform: {},
};

module.exports = {
  collectCoverage: true,
  projects: [main, e2e],
};

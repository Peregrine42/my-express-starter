const main = {
  displayName: "main",
  testMatch: ["<rootDir>/dist/main-suite/**/*.test.cjs"],
  coveragePathIgnorePatterns: ["node_modules"],
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

export default {
  collectCoverage: true,
  projects: [main, e2e],
};

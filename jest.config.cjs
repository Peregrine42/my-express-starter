/** @type {import("jest").Config} */
module.exports = {
  roots: ["./dist"],
  testMatch: ["<rootDir>/dist/**/*.test.cjs"],
  collectCoverageFrom: ["!**/_virtual/**"],
  setupFilesAfterEnv: ["<rootDir>/test/setupTests.js"],
  collectCoverage: true,
};

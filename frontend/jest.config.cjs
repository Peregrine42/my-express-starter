/** @type {import("jest").Config} */
module.exports = {
  testEnvironment: "jest-environment-jsdom",
  testPathIgnorePatterns: ["<rootDir>/test"],
  collectCoverageFrom: [
    "!**/_virtual/**",
    "!**/node_modules/**",
    "!**/frontend/**",
    "!**/public/**",
    "!**/coverage/**",
    "!test/**",
    "!src/**",
    "!*"
  ],
  setupFilesAfterEnv: ["<rootDir>/test/setupTests.cjs"],
  collectCoverage: true,
};

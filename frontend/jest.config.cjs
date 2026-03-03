module.exports = {
  testEnvironment: "jest-environment-jsdom",
  testPathIgnorePatterns: ["<rootDir>/test"],
  setupFilesAfterEnv: ["<rootDir>/test/setupTests.js"],
};

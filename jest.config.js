export default {
  testEnvironment: "node",
  transform: {},
  moduleFileExtensions: ["js", "mjs"],
  testMatch: ["**/__tests__/**/*.test.js", "**/*.test.js"],
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/index.js",
    "!src/handlers/**",
    "!src/services/feishu.js",
  ],
  coverageDirectory: "coverage",
  verbose: true,
  testTimeout: 10000,
};

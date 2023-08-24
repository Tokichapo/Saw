module.exports = {
  // The preset deals with preferring TS over JS
  moduleFileExtensions: [
    // .ts first to prefer a ts over a js if present
    "ts",
    "js",
  ],
  testMatch: ["<rootDir>/test/**/?(*.)+(test).ts"],

  testEnvironment: "node",
  coverageThreshold: {
    global: {
      branches: 80,
      statements: 80,
    },
  },
  collectCoverage: true,
  coverageReporters: ["lcov", "html", "text-summary"],
  coveragePathIgnorePatterns: [
    "\\.generated\\.[jt]s$",
    "<rootDir>/test/",
    ".warnings.jsii.js$",
  ],
  reporters: [
    "default",
    ["jest-junit", { suiteName: "jest tests", outputDirectory: "coverage" }],
  ],
};

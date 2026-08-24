/** @type {import("jest").Config} */
module.exports = {
      testEnvironment: "node",
      roots: ["<rootDir>/tests"],
      testMatch: ["**/*.test.ts"],
    
      extensionsToTreatAsEsm: [".ts"],
    
      transform: {
        "^.+\\.ts$": [
          "babel-jest",
          {
            configFile: "./babel.config.cjs",
          },
        ],
      },
    
      setupFiles: [
        "<rootDir>/tests/setup.ts",
      ],
    
      clearMocks: true,
    };
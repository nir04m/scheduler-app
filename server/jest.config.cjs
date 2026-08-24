/** @type {import("jest").Config} */
module.exports = {
      testEnvironment: "node",
    
      roots: ["<rootDir>/tests"],
    
      testMatch: ["**/*.test.ts"],
    
      extensionsToTreatAsEsm: [".ts", ".mts"],
    
      transform: {
        "^.+\\.(ts|mts)$": [
          "babel-jest",
          {
            configFile: "./babel.config.cjs",
          },
        ],
      },
    
      moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.mjs$": "$1.mts",
      },
    
      setupFiles: [
        "<rootDir>/tests/setup.ts",
      ],
    
      clearMocks: true,
    };
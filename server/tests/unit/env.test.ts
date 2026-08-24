import { parseEnv } from "../../src/config/env";

describe("environment configuration", () => {
  it("accepts valid configuration", () => {
    const result = parseEnv({
      NODE_ENV: "production",
      PORT: "5000",
      DATABASE_URL:
        "postgres://user:password@example.com/database",
      DIRECT_DATABASE_URL:
        "postgres://user:password@example.com/database",
      CLIENT_URL: "https://example.com",
    });

    expect(result.NODE_ENV).toBe("production");
    expect(result.PORT).toBe(5000);
    expect(result.CLIENT_URL).toBe(
      "https://example.com"
    );
  });

  it("rejects a missing DATABASE_URL", () => {
    expect(() =>
      parseEnv({
        NODE_ENV: "production",
        CLIENT_URL: "https://example.com",
      })
    ).toThrow(
      "Invalid environment configuration"
    );
  });

  it("rejects an invalid CLIENT_URL", () => {
    expect(() =>
      parseEnv({
        NODE_ENV: "production",
        DATABASE_URL:
          "postgres://user:password@example.com/database",
        CLIENT_URL: "not-a-url",
      })
    ).toThrow(
      "Invalid environment configuration"
    );
  });

  it("rejects an invalid port", () => {
    expect(() =>
      parseEnv({
        NODE_ENV: "production",
        PORT: "99999",
        DATABASE_URL:
          "postgres://user:password@example.com/database",
        CLIENT_URL: "https://example.com",
      })
    ).toThrow(
      "Invalid environment configuration"
    );
  });
});
import { config } from "dotenv";

config({
  path: ".env.test",
  override: true,
});

if (process.env.NODE_ENV !== "test") {
  throw new Error(
    "Tests must run with NODE_ENV=test"
  );
}

const databaseUrl =
  process.env.DIRECT_DATABASE_URL;

if (!databaseUrl?.includes(":51314/")) {
  throw new Error(
    "Refusing to run tests against a non-test database"
  );
}
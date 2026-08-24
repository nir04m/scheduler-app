import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce
    .number()
    .int()
    .positive()
    .max(65535)
    .default(5000),

  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required"),

  DIRECT_DATABASE_URL: z
    .string()
    .min(1)
    .optional(),

  CLIENT_URL: z
    .url("CLIENT_URL must be a valid URL"),
});

export function parseEnv(
  values: NodeJS.ProcessEnv
) {
  const result = envSchema.safeParse(values);

  if (!result.success) {
    throw new Error(
      "Invalid environment configuration"
    );
  }

  return result.data;
}

export const env = parseEnv(process.env);
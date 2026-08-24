import type { CorsOptions } from "cors";

const allowedOrigins = [
  process.env.CLIENT_URL,
].filter((origin): origin is string => Boolean(origin));

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Requests without Origin are allowed.
    // Examples: Postman, server-to-server requests, curl.
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(
      new Error("Origin not allowed by CORS")
    );
  },

  methods: [
    "GET",
    "POST",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Organizer-Token",
  ],
};
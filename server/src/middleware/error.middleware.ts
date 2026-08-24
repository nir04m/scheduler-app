
import type {
      ErrorRequestHandler,
    } from "express";

    import { logError } from "../utils/logger";
    
    export const errorHandler: ErrorRequestHandler = (
      error,
      _req,
      res,
      _next
    ) => {
      logError("unhandled request error", error);
    
      if (
        error instanceof SyntaxError &&
        "body" in error
      ) {
        return res.status(400).json({
          message: "Invalid JSON body",
        });
      }
    
      if (
        typeof error === "object" &&
        error !== null &&
        "type" in error &&
        error.type === "entity.too.large"
      ) {
        return res.status(413).json({
          message: "Request body is too large",
        });
      }
    
      if (
        error instanceof Error &&
        error.message === "Origin not allowed by CORS"
      ) {
        return res.status(403).json({
          message: "Origin not allowed",
        });
      }
    
      return res.status(500).json({
        message: "Internal server error",
      });
    };
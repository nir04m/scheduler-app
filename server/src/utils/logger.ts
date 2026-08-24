const SENSITIVE_KEYS = new Set([
      "organizertoken",
      "responsetoken",
      "responsetokenhash",
      "authorization",
      "x-organizer-token",
      "database_url",
      "direct_database_url",
    ]);
    
    function redactValue(
      value: unknown,
      key?: string
    ): unknown {
      if (
        key &&
        SENSITIVE_KEYS.has(key.toLowerCase())
      ) {
        return "[REDACTED]";
      }
    
      if (Array.isArray(value)) {
        return value.map((item) =>
          redactValue(item)
        );
      }
    
      if (
        typeof value === "object" &&
        value !== null
      ) {
        const result: Record<string, unknown> = {};
    
        for (const [childKey, childValue] of Object.entries(
          value
        )) {
          result[childKey] = redactValue(
            childValue,
            childKey
          );
        }
    
        return result;
      }
    
      return value;
    }
    
    export function logError(
      message: string,
      error?: unknown
    ) {
      if (process.env.NODE_ENV === "test") {
        return;
      }
    
      if (error instanceof Error) {
        console.error(message, {
          name: error.name,
          message: error.message,
        });
    
        return;
      }
    
      console.error(
        message,
        redactValue(error)
      );
    }
    
    export function logInfo(
      message: string,
      data?: unknown
    ) {
      if (process.env.NODE_ENV === "test") {
        return;
      }
    
      if (data === undefined) {
        console.log(message);
        return;
      }
    
      console.log(
        message,
        redactValue(data)
      );
    }
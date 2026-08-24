import {
      logInfo,
    } from "../../src/utils/logger";
import { jest } from "@jest/globals";
    
    describe("logger security", () => {
      it("does not expose sensitive values", () => {
        const spy = jest
          .spyOn(console, "log")
          .mockImplementation(() => {});
    
        const originalNodeEnv =
          process.env.NODE_ENV;
    
        process.env.NODE_ENV = "development";
    
        logInfo("security test", {
          organizerToken: "secret-organizer-token",
          responseToken: "secret-response-token",
          responseTokenHash: "secret-hash",
          safeValue: "visible",
        });
    
        expect(spy).toHaveBeenCalled();
    
        const loggedValue =
          JSON.stringify(
            spy.mock.calls
          );
    
        expect(loggedValue).not.toContain(
          "secret-organizer-token"
        );
    
        expect(loggedValue).not.toContain(
          "secret-response-token"
        );
    
        expect(loggedValue).not.toContain(
          "secret-hash"
        );
    
        expect(loggedValue).toContain(
          "[REDACTED]"
        );
    
        expect(loggedValue).toContain(
          "visible"
        );
    
        process.env.NODE_ENV =
          originalNodeEnv;
    
        spy.mockRestore();
      });
    });
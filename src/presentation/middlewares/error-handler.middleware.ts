import { Elysia } from "elysia";
import { logger } from "@shared/logger/logger";

export const errorHandler = new Elysia().onError(({ code, error, set }) => {
  logger.error({ code, error }, `Error [${code}]`);

  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : "An error occurred";

  switch (code) {
    case "VALIDATION":
      set.status = 400;
      return {
        error: "Validation error",
        message: errorMessage,
      };
    case "NOT_FOUND":
      set.status = 404;
      return {
        error: "Not found",
        message: errorMessage,
      };
    default:
      set.status = 500;
      return {
        error: "Internal server error",
        message:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      };
  }
});


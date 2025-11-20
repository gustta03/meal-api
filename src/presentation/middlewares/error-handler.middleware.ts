import { Elysia } from "elysia";

/**
 * Middleware global para tratamento de erros
 */
export const errorHandler = new Elysia().onError(({ code, error, set }) => {
  console.error(`Error [${code}]:`, error);

  // Extrai a mensagem de erro de forma segura
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


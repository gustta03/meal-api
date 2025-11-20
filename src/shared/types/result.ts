/**
 * Result type para tratamento de erros sem exceções
 * Seguindo princípios de Clean Code e programação funcional
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export const success = <T, E = Error>(data: T): Result<T, E> => ({
  success: true,
  data,
});

export const failure = <E>(error: E): Result<never, E> => ({
  success: false,
  error,
});


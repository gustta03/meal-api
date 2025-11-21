import { ProcessMessageUseCase } from "@application/use-cases/process-message.use-case";

export const makeProcessMessageUseCase = (): ProcessMessageUseCase => {
  return new ProcessMessageUseCase();
};


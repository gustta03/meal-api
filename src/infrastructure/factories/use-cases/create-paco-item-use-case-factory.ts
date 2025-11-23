import { CreatePacoItemUseCase } from "@application/use-cases/create-paco-item.use-case";
import { makePacoRepository } from "../repositories/paco-repository-factory";

export const makeCreatePacoItemUseCase = (): CreatePacoItemUseCase => {
  return new CreatePacoItemUseCase(makePacoRepository());
};


import { ListPacoItemsUseCase } from "@application/use-cases/list-paco-items.use-case";
import { makePacoRepository } from "../repositories/paco-repository-factory";

export const makeListPacoItemsUseCase = (): ListPacoItemsUseCase => {
  return new ListPacoItemsUseCase(makePacoRepository());
};


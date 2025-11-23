import { SearchPacoItemsUseCase } from "@application/use-cases/search-paco-items.use-case";
import { makePacoRepository } from "../repositories/paco-repository-factory";

export const makeSearchPacoItemsUseCase = (): SearchPacoItemsUseCase => {
  return new SearchPacoItemsUseCase(makePacoRepository());
};


import { PacoController } from "@presentation/controllers/paco.controller";
import { makeCreatePacoItemUseCase } from "../use-cases/create-paco-item-use-case-factory";
import { makeListPacoItemsUseCase } from "../use-cases/list-paco-items-use-case-factory";
import { makeSearchPacoItemsUseCase } from "../use-cases/search-paco-items-use-case-factory";

export const makePacoController = (): PacoController => {
  return new PacoController(
    makeCreatePacoItemUseCase(),
    makeListPacoItemsUseCase(),
    makeSearchPacoItemsUseCase()
  );
};


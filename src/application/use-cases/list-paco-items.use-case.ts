import { PacoItem } from "@domain/entities/paco-item.entity";
import { IPacoRepository } from "@domain/repositories/paco.repository";
import { Result, success, failure } from "@shared/types/result";
import { logger } from "@shared/logger/logger";

export class ListPacoItemsUseCase {
  constructor(private readonly pacoRepository: IPacoRepository) {}

  async execute(): Promise<Result<PacoItem[], string>> {
    try {
      const items = await this.pacoRepository.findAll();
      return success(items);
    } catch (error) {
      logger.error({ error }, "Failed to list PACO items");
      const errorMessage = error instanceof Error ? error.message : "Failed to list PACO items";
      return failure(errorMessage);
    }
  }
}


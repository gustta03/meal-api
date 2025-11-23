import { PacoItem } from "@domain/entities/paco-item.entity";
import { IPacoRepository } from "@domain/repositories/paco.repository";
import { Result, success, failure } from "@shared/types/result";
import { logger } from "@shared/logger/logger";

export class SearchPacoItemsUseCase {
  constructor(private readonly pacoRepository: IPacoRepository) {}

  async execute(searchTerm: string): Promise<Result<PacoItem[], string>> {
    try {
      if (!searchTerm || searchTerm.trim().length === 0) {
        return failure("Search term is required");
      }

      const items = await this.pacoRepository.search(searchTerm);
      return success(items);
    } catch (error) {
      logger.error({ error, searchTerm }, "Failed to search PACO items");
      const errorMessage = error instanceof Error ? error.message : "Failed to search PACO items";
      return failure(errorMessage);
    }
  }
}


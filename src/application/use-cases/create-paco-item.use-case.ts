import { PacoItem } from "@domain/entities/paco-item.entity";
import { IPacoRepository } from "@domain/repositories/paco.repository";
import { CreatePacoItemDto } from "../dtos/create-paco-item.dto";
import { Result, success, failure } from "@shared/types/result";
import { generateUUID } from "@shared/utils/uuid";
import { ERROR_MESSAGES } from "@shared/constants/error-messages.constants";
import { logger } from "@shared/logger/logger";

export class CreatePacoItemUseCase {
  constructor(private readonly pacoRepository: IPacoRepository) {}

  async execute(dto: CreatePacoItemDto): Promise<Result<PacoItem, string>> {
    try {
      const existingItem = await this.pacoRepository.findByName(dto.name);
      if (existingItem) {
        logger.warn({ name: dto.name }, "PACO item already exists");
        return failure("PACO item with this name already exists");
      }

      const id = generateUUID();

      const pacoItem = PacoItem.create(
        id,
        dto.name,
        dto.energyKcal,
        dto.proteinG,
        dto.carbG,
        dto.fatG,
        dto.standardPortionG,
        dto.unit,
        dto.alternativeNames
      );

      const savedItem = await this.pacoRepository.save(pacoItem);

      logger.info({ id: savedItem.id, name: savedItem.nome }, "PACO item created successfully");
      return success(savedItem);
    } catch (error) {
      logger.error({ error, dto }, "Failed to create PACO item");
      const errorMessage = error instanceof Error ? error.message : "Failed to create PACO item";
      return failure(errorMessage);
    }
  }
}


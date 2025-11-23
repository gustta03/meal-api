import { CreatePacoItemUseCase } from "@application/use-cases/create-paco-item.use-case";
import { ListPacoItemsUseCase } from "@application/use-cases/list-paco-items.use-case";
import { SearchPacoItemsUseCase } from "@application/use-cases/search-paco-items.use-case";
import { PacoItemMapper } from "@application/mappers/paco-item.mapper";
import { CreatePacoItemDto } from "@application/dtos/create-paco-item.dto";
import { PacoItemResponseDto } from "@application/dtos/paco-item-response.dto";
import { Result } from "@shared/types/result";
import { PacoItem } from "@domain/entities/paco-item.entity";

export class PacoController {
  constructor(
    private readonly createPacoItemUseCase: CreatePacoItemUseCase,
    private readonly listPacoItemsUseCase: ListPacoItemsUseCase,
    private readonly searchPacoItemsUseCase: SearchPacoItemsUseCase
  ) {}

  async create(dto: CreatePacoItemDto): Promise<Result<PacoItemResponseDto, string>> {
    const result = await this.createPacoItemUseCase.execute(dto);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      data: PacoItemMapper.toDto(result.data),
    };
  }

  async list(): Promise<Result<PacoItemResponseDto[], string>> {
    const result = await this.listPacoItemsUseCase.execute();

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      data: PacoItemMapper.toDtoList(result.data),
    };
  }

  async search(searchTerm: string): Promise<Result<PacoItemResponseDto[], string>> {
    const result = await this.searchPacoItemsUseCase.execute(searchTerm);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      data: PacoItemMapper.toDtoList(result.data),
    };
  }
}


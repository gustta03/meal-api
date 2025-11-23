import { PacoItem } from "@domain/entities/paco-item.entity";
import { PacoItemResponseDto } from "../dtos/paco-item-response.dto";

export class PacoItemMapper {
  static toDto(item: PacoItem): PacoItemResponseDto {
    return {
      id: item.id,
      name: item.nome,
      energyKcal: item.energiaKcal,
      proteinG: item.proteinaG,
      carbG: item.carboidratoG,
      fatG: item.lipidioG,
      standardPortionG: item.porcaoPadraoG,
      unit: item.unidade,
      alternativeNames: item.nomeAlternativo,
    };
  }

  static toDtoList(items: PacoItem[]): PacoItemResponseDto[] {
    return items.map((item) => this.toDto(item));
  }
}


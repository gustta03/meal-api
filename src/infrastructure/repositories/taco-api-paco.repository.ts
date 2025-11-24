import { PacoItem } from "@domain/entities/paco-item.entity";
import { IPacoRepository } from "@domain/repositories/paco.repository";
import { TacoGraphQLClient } from "../taco/taco-graphql-client";
import { logger } from "@shared/logger/logger";

export class TacoApiPacoRepository implements IPacoRepository {
  constructor(private readonly tacoClient: TacoGraphQLClient) {}

  async findById(id: string): Promise<PacoItem | null> {
    try {
      const tacoFood = await this.tacoClient.findById(id);
      
      if (!tacoFood) {
        return null;
      }

      return this.mapTacoFoodToPacoItem(tacoFood);
    } catch (error) {
      logger.error({ error, id }, "Failed to find PACO item by id from TACO API");
      return null;
    }
  }

  async findByName(name: string): Promise<PacoItem | null> {
    try {
      const tacoFood = await this.tacoClient.findByName(name);
      
      if (!tacoFood) {
        return null;
      }

      return this.mapTacoFoodToPacoItem(tacoFood);
    } catch (error) {
      logger.error({ error, name }, "Failed to find PACO item by name from TACO API");
      return null;
    }
  }

  async search(searchTerm: string): Promise<PacoItem[]> {
    try {
      const tacoFoods = await this.tacoClient.search(searchTerm);
      return tacoFoods.map((food) => this.mapTacoFoodToPacoItem(food));
    } catch (error) {
      logger.error({ error, searchTerm }, "Failed to search PACO items from TACO API");
      return [];
    }
  }

  async findAll(): Promise<PacoItem[]> {
    try {
      const tacoFoods = await this.tacoClient.findAll();
      return tacoFoods.map((food) => this.mapTacoFoodToPacoItem(food));
    } catch (error) {
      logger.error({ error }, "Failed to find all PACO items from TACO API");
      return [];
    }
  }

  async save(item: PacoItem): Promise<PacoItem> {
    logger.warn({ itemId: item.id }, "Save operation not supported in TACO API repository");
    throw new Error("Save operation is not supported when using TACO API. The API is read-only.");
  }

  private mapTacoFoodToPacoItem(tacoFood: {
    id: number;
    name: string;
    nutrients: {
      kcal: number | null;
      protein: number | null;
      lipids: number | null;
      carbohydrates: number | null;
    };
  }): PacoItem {
    // Valores padrão para 100g (porção padrão da TACO)
    const porcaoPadraoG = 100;
    const energiaKcal = tacoFood.nutrients.kcal ?? 0;
    const proteinaG = tacoFood.nutrients.protein ?? 0;
    const carboidratoG = tacoFood.nutrients.carbohydrates ?? 0;
    const lipidioG = tacoFood.nutrients.lipids ?? 0;

    return PacoItem.create(
      tacoFood.id.toString(),
      tacoFood.name,
      energiaKcal,
      proteinaG,
      carboidratoG,
      lipidioG,
      porcaoPadraoG,
      "g"
    );
  }
}


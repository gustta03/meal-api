import { Food } from "@domain/entities/food.entity";

/**
 * Schema/Document do MongoDB para Food
 */
export interface FoodDocument {
  _id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mapper para converter entre entidade de domínio e documento do MongoDB
 */
export class FoodSchema {
  /**
   * Converte entidade Food para documento MongoDB
   */
  static toDocument(food: Food): FoodDocument {
    return {
      _id: food.id,
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      createdAt: food.createdAt,
      updatedAt: food.updatedAt,
    };
  }

  /**
   * Converte documento MongoDB para entidade Food
   */
  static toEntity(doc: FoodDocument): Food {
    return Food.fromPersistence(
      doc._id,
      doc.name,
      doc.calories,
      doc.protein,
      doc.carbs,
      doc.fat,
      doc.createdAt,
      doc.updatedAt
    );
  }

  /**
   * Converte array de documentos para array de entidades
   */
  static toEntityList(docs: FoodDocument[]): Food[] {
    return docs.map((doc) => this.toEntity(doc));
  }
}


import { Food } from "../entities/food.entity";

/**
 * Interface do repositório de Food
 * Define o contrato que deve ser implementado pela camada de infraestrutura
 */
export interface IFoodRepository {
  findById(id: string): Promise<Food | null>;
  findAll(): Promise<Food[]>;
  save(food: Food): Promise<Food>;
  update(food: Food): Promise<Food>;
  delete(id: string): Promise<void>;
  findByName(name: string): Promise<Food | null>;
}


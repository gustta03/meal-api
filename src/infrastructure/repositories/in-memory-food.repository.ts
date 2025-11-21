import { Food } from "@domain/entities/food.entity";
import { IFoodRepository } from "@domain/repositories/food.repository";

export class InMemoryFoodRepository implements IFoodRepository {
  private foods: Map<string, Food> = new Map();

  async findById(id: string): Promise<Food | null> {
    return this.foods.get(id) || null;
  }

  async findAll(): Promise<Food[]> {
    return Array.from(this.foods.values());
  }

  async save(food: Food): Promise<Food> {
    this.foods.set(food.id, food);
    return food;
  }

  async update(food: Food): Promise<Food> {
    if (!this.foods.has(food.id)) {
      throw new Error("Food not found");
    }
    this.foods.set(food.id, food);
    return food;
  }

  async delete(id: string): Promise<void> {
    if (!this.foods.has(id)) {
      throw new Error("Food not found");
    }
    this.foods.delete(id);
  }

  async findByName(name: string): Promise<Food | null> {
    const foods = Array.from(this.foods.values());
    return foods.find((food) => food.name.toLowerCase() === name.toLowerCase()) || null;
  }
}


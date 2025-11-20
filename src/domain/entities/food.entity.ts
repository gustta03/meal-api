/**
 * Entidade de Domínio: Food
 * Representa um alimento no domínio da aplicação
 */
export class Food {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly calories: number,
    public readonly protein: number,
    public readonly carbs: number,
    public readonly fat: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    this.validate();
  }

  static create(
    id: string,
    name: string,
    calories: number,
    protein: number,
    carbs: number,
    fat: number
  ): Food {
    const now = new Date();
    return new Food(id, name, calories, protein, carbs, fat, now, now);
  }

  static fromPersistence(
    id: string,
    name: string,
    calories: number,
    protein: number,
    carbs: number,
    fat: number,
    createdAt: Date,
    updatedAt: Date
  ): Food {
    return new Food(id, name, calories, protein, carbs, fat, createdAt, updatedAt);
  }

  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error("Food ID is required");
    }

    if (!this.name || this.name.trim().length === 0) {
      throw new Error("Food name is required");
    }

    if (this.calories < 0) {
      throw new Error("Calories cannot be negative");
    }

    if (this.protein < 0) {
      throw new Error("Protein cannot be negative");
    }

    if (this.carbs < 0) {
      throw new Error("Carbs cannot be negative");
    }

    if (this.fat < 0) {
      throw new Error("Fat cannot be negative");
    }
  }

  updateMacros(calories: number, protein: number, carbs: number, fat: number): Food {
    return new Food(
      this.id,
      this.name,
      calories,
      protein,
      carbs,
      fat,
      this.createdAt,
      new Date()
    );
  }
}


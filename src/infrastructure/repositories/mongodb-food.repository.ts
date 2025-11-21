import { Food } from "@domain/entities/food.entity";
import { IFoodRepository } from "@domain/repositories/food.repository";
import { MongoDBConnection } from "../database/mongodb.connection";
import { FoodSchema, FoodDocument } from "../database/schemas/food.schema";
import { Collection, ObjectId } from "mongodb";

export class MongoDBFoodRepository implements IFoodRepository {
  private readonly collectionName = "foods";
  private get collection(): Collection<FoodDocument> {
    return MongoDBConnection.getInstance()
      .getDatabase()
      .collection<FoodDocument>(this.collectionName);
  }

  async findById(id: string): Promise<Food | null> {
    try {
      const doc = await this.collection.findOne({ _id: id });
      return doc ? FoodSchema.toEntity(doc) : null;
    } catch (error) {
      throw new Error(`Failed to find food by id: ${error}`);
    }
  }

  async findAll(): Promise<Food[]> {
    try {
      const docs = await this.collection.find({}).toArray();
      return FoodSchema.toEntityList(docs);
    } catch (error) {
      throw new Error(`Failed to find all foods: ${error}`);
    }
  }

  async save(food: Food): Promise<Food> {
    try {
      const doc = FoodSchema.toDocument(food);
      await this.collection.insertOne(doc);
      return food;
    } catch (error) {
      throw new Error(`Failed to save food: ${error}`);
    }
  }

  async update(food: Food): Promise<Food> {
    try {
      const doc = FoodSchema.toDocument(food);
      const result = await this.collection.updateOne(
        { _id: food.id },
        { $set: doc }
      );

      if (result.matchedCount === 0) {
        throw new Error("Food not found");
      }

      return food;
    } catch (error) {
      if (error instanceof Error && error.message === "Food not found") {
        throw error;
      }
      throw new Error(`Failed to update food: ${error}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const result = await this.collection.deleteOne({ _id: id });

      if (result.deletedCount === 0) {
        throw new Error("Food not found");
      }
    } catch (error) {
      if (error instanceof Error && error.message === "Food not found") {
        throw error;
      }
      throw new Error(`Failed to delete food: ${error}`);
    }
  }

  async findByName(name: string): Promise<Food | null> {
    try {
      const doc = await this.collection.findOne({
        name: { $regex: new RegExp(`^${name}$`, "i") },
      });
      return doc ? FoodSchema.toEntity(doc) : null;
    } catch (error) {
      throw new Error(`Failed to find food by name: ${error}`);
    }
  }
}


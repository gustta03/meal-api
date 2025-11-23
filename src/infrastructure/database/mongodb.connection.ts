import { MongoClient, Db } from "mongodb";
import { logger } from "@shared/logger/logger";

export class MongoDBConnection {
  private static instance: MongoDBConnection;
  private client: MongoClient | null = null;
  private db: Db | null = null;

  private constructor() {}

  static getInstance(): MongoDBConnection {
    if (!MongoDBConnection.instance) {
      MongoDBConnection.instance = new MongoDBConnection();
    }
    return MongoDBConnection.instance;
  }

  async connect(): Promise<void> {
    if (this.client) {
      return;
    }

    const uri = process.env.MONGODB_URI || "mongodb://admin:admin123@localhost:27017/?authSource=admin";
    const dbName = process.env.MONGODB_DB_NAME || "bot-nutri";

    try {
      this.client = new MongoClient(uri);
      await this.client.connect();
      this.db = this.client.db(dbName);

      logger.info({ dbName }, "Connected to MongoDB");
    } catch (error) {
      logger.error({ error, uri: uri.replace(/\/\/.*@/, "//***@") }, "Failed to connect to MongoDB");
      throw error;
    }
  }

  getDatabase(): Db {
    if (!this.db) {
      throw new Error("Database not connected. Call connect() first.");
    }
    return this.db;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      logger.info("Disconnected from MongoDB");
    }
  }

  isConnected(): boolean {
    return this.client !== null && this.db !== null;
  }
}


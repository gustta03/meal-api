import { MongoClient, Db } from "mongodb";

/**
 * Classe para gerenciar conexão com MongoDB
 * Implementa padrão Singleton para garantir uma única conexão
 */
export class MongoDBConnection {
  private static instance: MongoDBConnection;
  private client: MongoClient | null = null;
  private db: Db | null = null;

  private constructor() {}

  /**
   * Retorna instância única do MongoDBConnection
   */
  static getInstance(): MongoDBConnection {
    if (!MongoDBConnection.instance) {
      MongoDBConnection.instance = new MongoDBConnection();
    }
    return MongoDBConnection.instance;
  }

  /**
   * Conecta ao MongoDB
   */
  async connect(): Promise<void> {
    if (this.client) {
      return;
    }

    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
    const dbName = process.env.MONGODB_DB_NAME || "bot-nutri";

    try {
      this.client = new MongoClient(uri);
      await this.client.connect();
      this.db = this.client.db(dbName);

      console.log("✅ Connected to MongoDB");
    } catch (error) {
      console.error("❌ Failed to connect to MongoDB:", error);
      throw error;
    }
  }

  /**
   * Retorna a instância do banco de dados
   */
  getDatabase(): Db {
    if (!this.db) {
      throw new Error("Database not connected. Call connect() first.");
    }
    return this.db;
  }

  /**
   * Desconecta do MongoDB
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      console.log("🔌 Disconnected from MongoDB");
    }
  }

  /**
   * Verifica se está conectado
   */
  isConnected(): boolean {
    return this.client !== null && this.db !== null;
  }
}


import { Result, success, failure } from "@shared/types/result";
import { MongoDBConnection } from "@infrastructure/database/mongodb.connection";
import { DATABASE } from "@shared/constants/database.constants";
import { logger } from "@shared/logger/logger";
import type { TacoItemDocument } from "@infrastructure/database/schemas/taco-item.schema";
import { generateUUID } from "@shared/utils/uuid";
import XLSX from "xlsx";

function parseNumber(value: unknown): number {
  if (value === null || value === undefined || value === "" || value === "NA" || value === "Tr") {
    return 0;
  }
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.,-]/g, "").replace(",", ".");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function parseString(value: unknown): string | undefined {
  if (value === null || value === undefined || value === "" || value === "NA") {
    return undefined;
  }
  if (typeof value === "string") {
    return value.trim().length > 0 ? value.trim() : undefined;
  }
  return String(value).trim();
}

function createSearchableText(nome: string, grupo?: string, marca?: string): string {
  const parts: string[] = [nome.toLowerCase()];
  if (grupo) parts.push(grupo.toLowerCase());
  if (marca) parts.push(marca.toLowerCase());
  return parts.join(" ");
}

export class ImportTacoUseCase {
  async executeFromBuffer(excelBuffer: Buffer): Promise<Result<{ imported: number }, string>> {
    const connection = MongoDBConnection.getInstance();
    
    try {
      logger.info("Connecting to MongoDB...");
      await connection.connect();
      
      const db = connection.getDatabase();
      const collection = db.collection<TacoItemDocument>(DATABASE.COLLECTIONS.TACO_ITEMS);
      
      logger.info("Clearing existing TACO data...");
      await collection.deleteMany({});
      
      logger.info("Reading Excel file from buffer...");
      const workbook = XLSX.read(excelBuffer, { type: "buffer" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      
      const data = XLSX.utils.sheet_to_json(firstSheet, {
        header: 2,
        defval: null,
        range: 2,
      }) as unknown[];
      
      logger.info({ totalRows: data.length }, "Excel file read successfully");
      
      const documents: TacoItemDocument[] = [];
      let currentGrupo = "";
      
      for (let i = 0; i < data.length; i++) {
        const row = data[i] as Record<string, unknown>;
        
        if (!row || !row["Alimento"]) {
          continue;
        }
        
        const alimentoNum = row["Alimento"];
        const descricao = parseString(row["Descrição dos alimentos"]);
        
        if (typeof alimentoNum === "string" && descricao === undefined) {
          currentGrupo = alimentoNum;
          continue;
        }
        
        if (descricao === undefined || descricao.length === 0) {
          continue;
        }
        
        const codigo = String(alimentoNum);
        const id = generateUUID();
        
        const doc: TacoItemDocument = {
          _id: id,
          codigo,
          nome: descricao,
          nomeCientifico: undefined,
          grupo: currentGrupo || "Não especificado",
          marca: undefined,
          energiaKcal: parseNumber(row["(kcal)"]),
          energiaKj: parseNumber(row["(kJ)"]),
          umidade: parseNumber(row["(%)"]),
          proteinaG: parseNumber(row["(g)"]),
          lipidioG: parseNumber(row["(g)_1"]),
          colesterolMg: parseNumber(row["(mg)"]),
          carboidratoG: parseNumber(row["(g)_2"]),
          fibraAlimentarG: parseNumber(row["(g)_3"]),
          cinzasG: parseNumber(row["(g)_4"]),
          calcioMg: parseNumber(row["(mg)_1"]),
          magnesioMg: parseNumber(row["(mg)_2"]),
          manganesMg: parseNumber(row["(mg)_3"]),
          fosforoMg: parseNumber(row["(mg)_4"]),
          ferroMg: parseNumber(row["(mg)_5"]),
          sodioMg: parseNumber(row["(mg)_6"]),
          potassioMg: parseNumber(row["(mg)_7"]),
          cobreMg: parseNumber(row["(mg)_8"]),
          zincoMg: parseNumber(row["(mg)_9"]),
          retinolMcg: parseNumber(row["(mcg)"]),
          reMcg: parseNumber(row["(mcg)_1"]),
          raeMcg: parseNumber(row["(mcg)_2"]),
          tiaminaMg: parseNumber(row["(mg)_10"]),
          riboflavinaMg: parseNumber(row["(mg)_11"]),
          piridoxinaMg: parseNumber(row["(mg)_12"]),
          niacinaMg: parseNumber(row["(mg)_13"]),
          vitaminaCMg: parseNumber(row["(mg)_14"]),
          porcaoPadraoG: 100,
          unidade: "g",
          createdAt: new Date(),
          updatedAt: new Date(),
          searchableText: createSearchableText(descricao, currentGrupo),
        };
        
        documents.push(doc);
        
        if (documents.length % 100 === 0) {
          logger.info({ imported: documents.length }, "Progress...");
        }
      }
      
      logger.info({ totalDocuments: documents.length }, "Inserting documents into MongoDB...");
      
      if (documents.length === 0) {
        return failure("Nenhum documento válido encontrado no arquivo Excel");
      }
      
      await collection.insertMany(documents);
      
      logger.info("Creating indexes...");
      await collection.createIndex({ nome: "text", searchableText: "text" });
      await collection.createIndex({ codigo: 1 });
      await collection.createIndex({ grupo: 1 });
      
      logger.info(
        {
          totalImported: documents.length,
          collection: DATABASE.COLLECTIONS.TACO_ITEMS,
        },
        "TACO data imported successfully"
      );
      
      return success({ imported: documents.length });
    } catch (error) {
      logger.error({ error }, "Failed to import TACO data");
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return failure(`Failed to import TACO data: ${errorMessage}`);
    }
  }
}

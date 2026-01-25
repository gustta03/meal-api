import { Elysia, t } from "elysia";
import { ImportTacoUseCase } from "@application/use-cases/import-taco.use-case";
import { logger } from "@shared/logger/logger";
import { MongoDBConnection } from "@infrastructure/database/mongodb.connection";
import { DATABASE } from "@shared/constants/database.constants";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "change-me-in-production";

function validateAdminToken(token: string | undefined): boolean {
  if (!ADMIN_TOKEN || ADMIN_TOKEN === "change-me-in-production") {
    logger.warn("ADMIN_TOKEN not set or using default value");
  }
  return token === ADMIN_TOKEN;
}

export function createAdminRoutes() {
  const importTacoUseCase = new ImportTacoUseCase();

  return new Elysia({ prefix: "/admin" })
    .post(
      "/import/taco",
      async ({ body, headers }) => {
        const authToken = headers["authorization"]?.replace("Bearer ", "") || headers["x-admin-token"];
        
        if (!validateAdminToken(authToken)) {
          logger.warn({ hasToken: !!authToken }, "Unauthorized import attempt");
          return new Response("Unauthorized", { status: 401 });
        }

        try {
          const file = body.file;

          if (!file) {
            return {
              success: false,
              error: "File is required. Send as multipart/form-data with 'file' field",
            };
          }

          logger.info({ fileName: file.name, fileSize: file.size }, "Processing uploaded file");
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          const result = await importTacoUseCase.executeFromBuffer(buffer);
          
          if (!result.success) {
            return {
              success: false,
              error: result.error,
            };
          }
          
          return {
            success: true,
            imported: result.data.imported,
            message: `Successfully imported ${result.data.imported} TACO items`,
          };
        } catch (error) {
          logger.error({ error }, "Error processing import request");
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
      {
        body: t.Object({
          file: t.File(),
        }),
      }
    )
    .get("/import/taco/status", async ({ headers }) => {
      const authToken = headers["authorization"]?.replace("Bearer ", "") || headers["x-admin-token"];
      
      if (!validateAdminToken(authToken)) {
        return new Response("Unauthorized", { status: 401 });
      }

      try {
        const connection = MongoDBConnection.getInstance();
        await connection.connect();
        
        const db = connection.getDatabase();
        const collection = db.collection(DATABASE.COLLECTIONS.TACO_ITEMS);
        const count = await collection.countDocuments();
        
        await connection.disconnect();
        
        return {
          success: true,
          count,
          collection: DATABASE.COLLECTIONS.TACO_ITEMS,
        };
      } catch (error) {
        logger.error({ error }, "Error checking TACO import status");
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });
}

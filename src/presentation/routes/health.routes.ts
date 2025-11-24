import { Elysia } from "elysia";
import { makeTacoClient } from "@infrastructure/factories/services/taco-client-factory";
import { makePacoRepository } from "@infrastructure/factories/repositories/paco-repository-factory";
import { CONFIG } from "@shared/constants/config.constants";
import { logger } from "@shared/logger/logger";

export function createHealthRoutes() {
  return new Elysia().get("/health/taco", async () => {
    const useTacoApi = process.env.USE_TACO_API === "true" || process.env.TACO_API_URL !== undefined;
    const tacoApiUrl = process.env.TACO_API_URL || CONFIG.TACO.API_URL;

    const health = {
      tacoApi: {
        enabled: useTacoApi,
        url: tacoApiUrl,
        status: "unknown" as "ok" | "error" | "unknown",
        message: "",
      },
      timestamp: new Date().toISOString(),
    };

    if (!useTacoApi) {
      health.tacoApi.status = "unknown";
      health.tacoApi.message = "TACO API não está configurada. Configure USE_TACO_API=true ou TACO_API_URL";
      return health;
    }

    try {
      // Teste simples: verificar se a API está acessível
      const tacoClient = makeTacoClient();
      const testResult = await tacoClient.search("arroz", 1);

      health.tacoApi.status = "ok";
      health.tacoApi.message = "API TACO está acessível e funcionando";
      
      return health;
    } catch (error) {
      logger.error({ error }, "Health check failed for TACO API");
      health.tacoApi.status = "error";
      health.tacoApi.message = error instanceof Error ? error.message : "Erro desconhecido";
      
      return health;
    }
  });
}


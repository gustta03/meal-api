import { IPacoRepository } from "@domain/repositories/paco.repository";
import { MongoDBPacoRepository } from "../../repositories/mongodb-paco.repository";
import { TacoApiPacoRepository } from "../../repositories/taco-api-paco.repository";
import { makeTacoClient } from "../services/taco-client-factory";
import { logger } from "@shared/logger/logger";

export const makePacoRepository = (): IPacoRepository => {
  const useTacoApi = process.env.USE_TACO_API === "true" || process.env.TACO_API_URL !== undefined;
  
  if (useTacoApi) {
    logger.info("Using TACO API repository");
    return new TacoApiPacoRepository(makeTacoClient());
  }
  
  logger.info("Using MongoDB PACO repository");
  return new MongoDBPacoRepository();
};


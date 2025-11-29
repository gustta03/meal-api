import { IWhatsAppRepository } from "@domain/repositories/whatsapp.repository";
import { WhapiWhatsAppRepository } from "../../whapi/whapi-whatsapp.repository";
import { CONFIG } from "@shared/constants/config.constants";
import { logger } from "@shared/logger/logger";

let whatsappRepositoryInstance: IWhatsAppRepository | null = null;

export const makeWhatsAppRepository = (): IWhatsAppRepository => {
  if (!whatsappRepositoryInstance) {
    const useWhapi = !!CONFIG.WHAPI.API_TOKEN;
    
    if (useWhapi) {
      logger.info("Using Whapi.cloud for WhatsApp integration");
      whatsappRepositoryInstance = new WhapiWhatsAppRepository(
        CONFIG.WHAPI.API_URL,
        CONFIG.WHAPI.API_TOKEN,
        CONFIG.WHAPI.CHANNEL_ID
      );
    } else {
      logger.warn("WHAPI_API_TOKEN not set, but Whapi repository is required. Please configure environment variables.");
      throw new Error("WHAPI_API_TOKEN is required. Please set WHAPI_API_TOKEN, WHAPI_CHANNEL_ID, and optionally WHAPI_API_URL environment variables.");
    }
  }
  
  return whatsappRepositoryInstance;
};


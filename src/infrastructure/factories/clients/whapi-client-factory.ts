import { WhapiClient } from "../../whapi/whapi-client";
import { CONFIG } from "@shared/constants/config.constants";

let whapiClientInstance: WhapiClient | null = null;

export const makeWhapiClient = (): WhapiClient => {
  if (!whapiClientInstance) {
    whapiClientInstance = new WhapiClient(
      CONFIG.WHAPI.API_URL,
      CONFIG.WHAPI.API_TOKEN,
      CONFIG.WHAPI.CHANNEL_ID
    );
  }
  return whapiClientInstance;
};



import { TacoGraphQLClient } from "../../taco/taco-graphql-client";
import { CONFIG } from "@shared/constants/config.constants";

let tacoClientInstance: TacoGraphQLClient | null = null;

export const makeTacoClient = (): TacoGraphQLClient => {
  if (!tacoClientInstance) {
    const apiUrl = process.env.TACO_API_URL || CONFIG.TACO.API_URL;
    tacoClientInstance = new TacoGraphQLClient(apiUrl);
  }
  return tacoClientInstance;
};


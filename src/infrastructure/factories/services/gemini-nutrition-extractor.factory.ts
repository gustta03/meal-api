/**
 * Factory para GeminiNutritionExtractor
 * 
 * Responsabilidade:
 * - Instanciar GeminiNutritionExtractor com todas as dependências
 * - Garantir singleton de instâncias
 */

import { GeminiService } from "@infrastructure/gemini/gemini.service";
import { GeminiNutritionExtractor } from "@infrastructure/gemini/gemini-nutrition-extractor";
import { NutritionValidator } from "@infrastructure/services/nutrition-validator.service";
import { NutritionCacheService } from "@infrastructure/services/nutrition-cache.service";

let geminiNutritionExtractorInstance: GeminiNutritionExtractor | null = null;

/**
 * Cria e retorna instância única de GeminiNutritionExtractor
 */
export function makeGeminiNutritionExtractor(): GeminiNutritionExtractor {
  if (geminiNutritionExtractorInstance) {
    return geminiNutritionExtractorInstance;
  }

  const geminiService = new GeminiService();
  const validator = new NutritionValidator();
  const cacheTTL = Number(process.env.NUTRITION_CACHE_TTL_SECONDS) || 86400; // 24h padrão
  const cache = new NutritionCacheService(cacheTTL);

  geminiNutritionExtractorInstance = new GeminiNutritionExtractor(
    geminiService,
    validator,
    cache
  );

  return geminiNutritionExtractorInstance;
}

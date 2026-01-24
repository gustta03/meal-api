/**
 * Serviço Gemini para Extração de Dados Nutricionais
 * 
 * Responsabilidades:
 * - Extrair dados nutricionais via Gemini
 * - Construir prompts estruturados e eficientes
 * - Parsear respostas JSON do Gemini
 * - Tratar erros de resposta
 */

import { GeminiService } from "./gemini.service";
import { NutritionValidator } from "../services/nutrition-validator.service";
import { NutritionCacheService } from "../services/nutrition-cache.service";
import { logger } from "@shared/logger/logger";
import { ERROR_MESSAGES } from "@shared/constants/error-messages.constants";
import type { ExtractedNutritionDto, NutritionExtractionResult } from "@application/dtos/extracted-nutrition.dto";

/**
 * Resposta esperada do Gemini em formato JSON
 */
interface GeminiNutritionResponse {
  readonly food_name: string;
  readonly weight_grams: number;
  readonly calories: number;
  readonly protein_g: number;
  readonly carbs_g: number;
  readonly fat_g: number;
  readonly fiber_g?: number;
  readonly confidence: "alta" | "média" | "baixa";
  readonly notes?: string;
}

export class GeminiNutritionExtractor {
  private readonly gemini: GeminiService;
  private readonly validator: NutritionValidator;
  private readonly cache: NutritionCacheService;

  constructor(
    gemini: GeminiService,
    validator: NutritionValidator,
    cache: NutritionCacheService
  ) {
    this.gemini = gemini;
    this.validator = validator;
    this.cache = cache;
  }

  /**
   * Extrai dados nutricionais de uma descrição de alimento
   */
  async extract(foodDescription: string, weightGrams: number): Promise<NutritionExtractionResult> {
    // 1. Verificar cache
    const cachedData = this.cache.get(foodDescription, weightGrams);
    if (cachedData) {
      logger.debug(
        { foodDescription, weightGrams },
        "Nutrition data retrieved from cache"
      );
      return {
        ...cachedData,
        isValid: true,
        warnings: [],
      };
    }

    // 2. Chamar Gemini
    const geminiResult = await this.callGemini(foodDescription, weightGrams);
    if (!geminiResult.success) {
      return {
        isValid: false,
        reason: geminiResult.error,
        attempted: { foodName: foodDescription, weightGrams },
      };
    }

    // 3. Validar resultado
    const validationResult = this.validator.validate(
      {
        foodName: geminiResult.data.food_name,
        weightGrams: geminiResult.data.weight_grams,
        calories: geminiResult.data.calories,
        proteinG: geminiResult.data.protein_g,
        carbsG: geminiResult.data.carbs_g,
        fatG: geminiResult.data.fat_g,
        fiberG: geminiResult.data.fiber_g,
      },
      geminiResult.data.confidence
    );

    if (!validationResult.isValid) {
      return validationResult;
    }

    // 4. Cachear resultado
    this.cache.set(foodDescription, weightGrams, validationResult);

    return validationResult;
  }

  /**
   * Faz chamada ao Gemini para extrair nutrição
   */
  private async callGemini(
    foodDescription: string,
    weightGrams: number
  ): Promise<{ success: true; data: GeminiNutritionResponse } | { success: false; error: string }> {
    try {
      const prompt = this.buildExtractionPrompt(foodDescription, weightGrams);
      const response = await this.gemini.model.generateContent(prompt);
      const responseText = response.response.text();

      const parsedResponse = this.parseGeminiResponse(responseText);
      return { success: true, data: parsedResponse };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.GEMINI.API_KEY_MISSING;
      logger.error(
        { error, foodDescription, weightGrams },
        "Failed to extract nutrition from Gemini"
      );
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Constrói prompt otimizado para Gemini
   */
  private buildExtractionPrompt(foodDescription: string, weightGrams: number): string {
    return `Você é um nutricionista especialista. Analise o alimento e forneça dados nutricionais precisos.

Alimento: "${foodDescription}"
Peso: ${weightGrams}g

Retorne APENAS um JSON válido (sem markdown, sem código blocks, JSON puro):
{
  "food_name": "nome padronizado do alimento em português",
  "weight_grams": ${weightGrams},
  "calories": número inteiro,
  "protein_g": número com até 1 casa decimal,
  "carbs_g": número com até 1 casa decimal,
  "fat_g": número com até 1 casa decimal,
  "fiber_g": número com até 1 casa decimal (opcional),
  "confidence": "alta" | "média" | "baixa",
  "notes": "observações opcionais (ex: 'valor estimado para versão frita')"
}

Regras de Precisão:
1. Se o alimento é vago ou não especifica preparação (ex: "frango", "peito de frango"):
   - Retorne nome genérico SEM assumir preparação: "Frango, peito"
   - Use valores nutricionais médios/genéricos (não específicos)
   - Marque confidence como "média"
2. Se é específico quanto à preparação (ex: "frango frito", "peito grelhado"):
   - Retorne nome completo com preparação
   - Use dados para essa preparação específica
   - Marque confidence como "alta"
3. Se é caseiro/receita complexa:
   - Faça estimativa baseada em ingredientes típicos
   - Marque confidence como "média" ou "baixa"
4. Confidence "alta" apenas para alimentos catalogados com preparação específica
5. Confidence "média" para estimativas bem fundamentadas ou preparação não especificada
6. Confidence "baixa" para alimentos muito vaguos ou regionais

Exemplo de resposta válida:
{"food_name":"Frango, peito","weight_grams":200,"calories":330,"protein_g":62.0,"carbs_g":0.0,"fat_g":7.0,"confidence":"média","notes":"Valores médios sem preparação específica"}`;
  }

  /**
   * Parseia resposta JSON do Gemini
   */
  private parseGeminiResponse(responseText: string): GeminiNutritionResponse {
    try {
      // Remover markdown code blocks se presente
      const cleaned = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const parsed = JSON.parse(cleaned) as GeminiNutritionResponse;

      // Validar estrutura básica
      if (!parsed.food_name || typeof parsed.calories !== "number") {
        throw new Error("Response missing required fields");
      }

      return parsed;
    } catch (error) {
      logger.error(
        { responseText, error },
        "Failed to parse Gemini nutrition response"
      );
      throw new Error("Gemini returned invalid JSON response");
    }
  }
}

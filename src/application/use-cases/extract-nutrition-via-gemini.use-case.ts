/**
 * Use Case: Extrair Dados Nutricionais via Gemini
 * 
 * Responsabilidades:
 * - Coordenar extração de nutrição com Gemini
 * - Converter resultado para NutritionAnalysisDto
 * - Tratar erros e retornar Result
 */

import { Result, success, failure } from "@shared/types/result";
import { GeminiNutritionExtractor } from "@infrastructure/gemini/gemini-nutrition-extractor";
import { ERROR_MESSAGES } from "@shared/constants/error-messages.constants";
import { logger } from "@shared/logger/logger";
import type { NutritionAnalysisDto } from "@application/dtos/nutrition-analysis.dto";

export class ExtractNutritionViaGeminiUseCase {
  constructor(private readonly geminiExtractor: GeminiNutritionExtractor) {}

  /**
   * Extrai dados nutricionais para um alimento específico
   */
  async executeForFood(
    foodDescription: string,
    weightGrams: number
  ): Promise<Result<NutritionAnalysisDto, string>> {
    if (!foodDescription || foodDescription.trim().length === 0) {
      return failure(ERROR_MESSAGES.NUTRITION.INVALID_INPUT);
    }

    if (weightGrams <= 0 || weightGrams > 5000) {
      return failure("Peso deve estar entre 1g e 5000g");
    }

    try {
      const extractionResult = await this.geminiExtractor.extract(
        foodDescription,
        weightGrams
      );

      if (!extractionResult.isValid) {
        logger.warn(
          { foodDescription, reason: extractionResult.reason },
          "Failed to extract nutrition via Gemini"
        );
        return failure(
          `Não consegui extrair dados de nutrição: ${extractionResult.reason}`
        );
      }

      const analysisDto = this.convertToNutritionAnalysis(extractionResult);
      return success(analysisDto);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : ERROR_MESSAGES.NUTRITION.FAILED_TO_ANALYZE;

      logger.error(
        { error, foodDescription, weightGrams },
        "Error in ExtractNutritionViaGeminiUseCase"
      );

      return failure(errorMessage);
    }
  }

  /**
   * Extrai dados nutricionais para múltiplos alimentos
   */
  async executeForFoods(
    foods: Array<{ description: string; weightGrams: number }>
  ): Promise<Result<NutritionAnalysisDto, string>> {
    if (foods.length === 0) {
      return failure(ERROR_MESSAGES.NUTRITION.INVALID_INPUT);
    }

    try {
      const extractedItems = await Promise.all(
        foods.map((food) =>
          this.geminiExtractor.extract(food.description, food.weightGrams)
        )
      );

      // Validar se todos foram extraídos com sucesso
      const invalidItems = extractedItems.filter((item) => !item.isValid);
      if (invalidItems.length > 0) {
        logger.warn(
          { totalItems: foods.length, failedItems: invalidItems.length },
          "Some nutrition items failed to extract"
        );
        // Continuar com itens válidos
      }

      const validItems = extractedItems.filter((item) => item.isValid);
      if (validItems.length === 0) {
        return failure(
          "Não consegui extrair dados nutricionais de nenhum alimento"
        );
      }

      const analysis = this.buildCombinedAnalysis(validItems);
      return success(analysis);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : ERROR_MESSAGES.NUTRITION.FAILED_TO_ANALYZE;

      logger.error(
        { error, foodCount: foods.length },
        "Error extracting multiple foods via Gemini"
      );

      return failure(errorMessage);
    }
  }

  /**
   * Converte resultado de extração para NutritionAnalysisDto
   */
  private convertToNutritionAnalysis(
    extractedData: any
  ): NutritionAnalysisDto {
    return {
      items: [
        {
          name: extractedData.foodName,
          quantity: `${extractedData.weightGrams}g`,
          weightGrams: extractedData.weightGrams,
          pacoId: `gemini_${Date.now()}`,
          nutrients: {
            kcal: extractedData.calories,
            proteinG: extractedData.proteinG,
            carbG: extractedData.carbsG,
            fatG: extractedData.fatG,
          },
        },
      ],
      totals: {
        kcal: Math.round(extractedData.calories * 100) / 100,
        proteinG: Math.round(extractedData.proteinG * 100) / 100,
        carbG: Math.round(extractedData.carbsG * 100) / 100,
        fatG: Math.round(extractedData.fatG * 100) / 100,
      },
    };
  }

  /**
   * Combina análises de múltiplos alimentos
   */
  private buildCombinedAnalysis(
    validItems: any[]
  ): NutritionAnalysisDto {
    const items = validItems.map((item) => ({
      name: item.foodName,
      quantity: `${item.weightGrams}g`,
      weightGrams: item.weightGrams,
      pacoId: `gemini_${Date.now()}`,
      nutrients: {
        kcal: item.calories,
        proteinG: item.proteinG,
        carbG: item.carbsG,
        fatG: item.fatG,
      },
    }));

    const totals = {
      kcal: 0,
      proteinG: 0,
      carbG: 0,
      fatG: 0,
    };

    items.forEach((item) => {
      totals.kcal += item.nutrients.kcal;
      totals.proteinG += item.nutrients.proteinG;
      totals.carbG += item.nutrients.carbG;
      totals.fatG += item.nutrients.fatG;
    });

    // Arredondar totais
    totals.kcal = Math.round(totals.kcal * 100) / 100;
    totals.proteinG = Math.round(totals.proteinG * 100) / 100;
    totals.carbG = Math.round(totals.carbG * 100) / 100;
    totals.fatG = Math.round(totals.fatG * 100) / 100;

    return { items, totals };
  }
}

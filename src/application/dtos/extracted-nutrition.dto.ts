/**
 * DTOs para extração de dados nutricionais via Gemini
 * 
 * Responsável por:
 * - Tipagem de requisições/respostas do Gemini
 * - Validação de dados nutricionais
 * - Transferência entre camadas
 */

export interface NutritionDataDto {
  readonly foodName: string;
  readonly weightGrams: number;
  readonly calories: number;
  readonly proteinG: number;
  readonly carbsG: number;
  readonly fatG: number;
  readonly fiberG?: number;
}

export interface ExtractedNutritionDto extends NutritionDataDto {
  readonly confidence: "alta" | "média" | "baixa";
  readonly source: "gemini" | "cache" | "database";
  readonly notes?: string;
}

export interface ValidatedNutritionDto extends ExtractedNutritionDto {
  readonly isValid: true;
  readonly warnings: readonly string[];
}

export interface InvalidNutritionDto {
  readonly isValid: false;
  readonly reason: string;
  readonly attempted: Partial<NutritionDataDto>;
}

export type NutritionExtractionResult = ValidatedNutritionDto | InvalidNutritionDto;

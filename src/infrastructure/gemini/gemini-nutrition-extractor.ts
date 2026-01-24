import { GeminiService } from "./gemini.service";
import { NutritionValidator } from "../services/nutrition-validator.service";
import { NutritionCacheService } from "../services/nutrition-cache.service";
import { logger } from "@shared/logger/logger";
import { ERROR_MESSAGES } from "@shared/constants/error-messages.constants";
import type { NutritionExtractionResult } from "@application/dtos/extracted-nutrition.dto";

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

interface GeminiMultipleFoodsResponse {
  readonly foods: readonly GeminiNutritionResponse[];
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

    const geminiResult = await this.callGemini(foodDescription, weightGrams);
    if (!geminiResult.success) {
      return {
        isValid: false,
        reason: geminiResult.error,
        attempted: { foodName: foodDescription, weightGrams },
      };
    }

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

    this.cache.set(foodDescription, weightGrams, validationResult);

    return validationResult;
  }

  async extractFromMessage(messageBody: string): Promise<Array<NutritionExtractionResult>> {
    try {
      const prompt = this.buildMultipleFoodsPrompt(messageBody);
      const response = await this.gemini.model.generateContent(prompt);
      const responseText = response.response.text();

      const parsedResponse = this.parseMultipleFoodsResponse(responseText);
      
      const results: Array<NutritionExtractionResult> = [];
      
      for (const foodData of parsedResponse.foods) {
        const validationResult = this.validator.validate(
          {
            foodName: foodData.food_name,
            weightGrams: foodData.weight_grams,
            calories: foodData.calories,
            proteinG: foodData.protein_g,
            carbsG: foodData.carbs_g,
            fatG: foodData.fat_g,
            fiberG: foodData.fiber_g,
          },
          foodData.confidence
        );

        results.push(validationResult);
      }

      return results;
    } catch (error) {
      logger.error(
        { error, messageBody },
        "Failed to extract multiple foods from message"
      );
      throw error;
    }
  }

  private buildMultipleFoodsPrompt(messageBody: string): string {
    return `Você é um mecanismo determinístico de análise nutricional.
Criatividade é estritamente proibida.

Seu único objetivo é analisar a mensagem do usuário, identificar TODOS os alimentos mencionados e retornar dados nutricionais matematicamente corretos para cada um.

Mensagem do usuário: "${messageBody}"

INSTRUÇÕES CRÍTICAS:
1. Identifique TODOS os alimentos mencionados na mensagem
2. Extraia o peso/quantidade de cada alimento (se não especificado, use valores conservadores)
3. Separe alimentos compostos (ex: "tapioca recheada com doce de leite" = 2 alimentos)
4. NÃO invente alimentos que não foram mencionados
5. NÃO assuma preparações não especificadas

PROIBIÇÕES ABSOLUTAS:
- Você NÃO PODE inferir método de preparo não especificado
- Você NÃO PODE assumir ingredientes, óleo, manteiga ou condimentos extras
- Você NÃO PODE extrapolar dados regionais ou marcas sem base
- Você NÃO PODE retornar "confidence": "alta" sem preparo explícito
- Você NÃO PODE ignorar regras matemáticas
- Você NÃO PODE retornar texto fora do JSON

REGRAS MATEMÁTICAS (INQUEBRÁVEIS):
- Carboidratos: 4 kcal por grama
- Proteínas: 4 kcal por grama
- Gorduras: 9 kcal por grama
- Calorias totais DEVEM ser calculadas como: (carbs_g × 4) + (protein_g × 4) + (fat_g × 9)
- A diferença entre as calorias calculadas e o campo "calories" NÃO pode exceder 5%
- Se houver inconsistência, ajuste os macronutrientes para refletir a realidade física do alimento

FORMATO DE SAÍDA (OBRIGATÓRIO - APENAS JSON):
{
  "foods": [
    {
      "food_name": "nome padronizado do alimento",
      "weight_grams": número,
      "calories": número inteiro,
      "protein_g": número (máx 1 casa decimal),
      "carbs_g": número (máx 1 casa decimal),
      "fat_g": número (máx 1 casa decimal),
      "fiber_g": número (máx 1 casa decimal, opcional),
      "confidence": "alta" | "média" | "baixa",
      "notes": "explicação lógica breve"
    }
  ]
}

Regras de Lógica:
1. Se o alimento é vago (ex: "frango"): Use valores para "Frango, peito, cozido" (padrão conservador) e marque confidence "média"
2. Se o preparo é explícito (ex: "frango frito"): Use valores específicos e marque confidence "alta"
3. Se fibra não for relevante ou confiável, omita fiber_g
4. Se o peso não for especificado, use valores conservadores baseados em porções típicas

VALORES DE REFERÊNCIA (por 100g):
- Arroz branco cozido: ~130 kcal, 2.3g proteína, 28g carboidrato, 0.2g gordura
- Batata cozida: ~75 kcal, 1.5g proteína, 17g carboidrato, 0.1g gordura
- Alface: ~15 kcal, 1.2g proteína, 2.5g carboidrato, 0.2g gordura
- Tapioca (massa): ~130 kcal, 0.1g proteína, 32g carboidrato, 0g gordura
- Doce de leite: ~310 kcal, 7g proteína, 50g carboidrato, 7g gordura

Exemplo de resposta válida:
{"foods":[{"food_name":"Tapioca recheada","weight_grams":100,"calories":300,"protein_g":2.5,"carbs_g":65.0,"fat_g":2.5,"confidence":"média","notes":"Valores estimados para tapioca recheada"},{"food_name":"Doce de leite","weight_grams":20,"calories":62,"protein_g":1.4,"carbs_g":10.0,"fat_g":1.4,"confidence":"alta"}]}`;
  }

  private parseMultipleFoodsResponse(responseText: string): GeminiMultipleFoodsResponse {
    try {
      const cleaned = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const parsed = JSON.parse(cleaned) as GeminiMultipleFoodsResponse;

      if (!parsed.foods || !Array.isArray(parsed.foods) || parsed.foods.length === 0) {
        throw new Error("Response must contain a non-empty 'foods' array");
      }

      for (const food of parsed.foods) {
        if (!food.food_name || typeof food.calories !== "number") {
          throw new Error("Each food must have 'food_name' and 'calories'");
        }

        const foodName = food.food_name.trim();
        const invalidPatterns = [
          "não especificado",
          "nao especificado",
          "não encontrado",
          "nao encontrado",
          "discriminação",
          "discriminacao",
          "sexual",
          "chá",
          "cha",
        ];

        if (
          foodName.length === 0 ||
          invalidPatterns.some((pattern) => foodName.toLowerCase().includes(pattern)) ||
          foodName.toLowerCase() === "alimento" ||
          foodName.length < 3 ||
          /^\d+$/.test(foodName)
        ) {
          throw new Error(`Invalid food name: "${foodName}"`);
        }
      }

      return parsed;
    } catch (error) {
      logger.error(
        { responseText, error },
        "Failed to parse Gemini multiple foods response"
      );
      throw new Error("Gemini returned invalid JSON response");
    }
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
    return `Você é um mecanismo determinístico de análise nutricional.
Criatividade é estritamente proibida.

Seu único objetivo é retornar dados nutricionais matematicamente corretos, consistentes e verificáveis.

Se qualquer informação necessária não estiver explicitamente definida, você deve:
1. Usar valores médios conservadores amplamente aceitos, OU
2. Reduzir o nível de "confidence"

PROIBIÇÕES ABSOLUTAS:
- Você NÃO PODE inferir método de preparo não especificado.
- Você NÃO PODE assumir ingredientes, óleo, manteiga ou condimentos extras.
- Você NÃO PODE extrapolar dados regionais ou marcas sem base.
- Você NÃO PODE retornar "confidence": "alta" sem preparo explícito.
- Você NÃO PODE ignorar regras matemáticas.
- Você NÃO PODE retornar texto fora do JSON.

REGRAS MATEMÁTICAS (INQUEBRÁVEIS):
- Carboidratos: 4 kcal por grama
- Proteínas: 4 kcal por grama
- Gorduras: 9 kcal por grama
- Calorias totais DEVEM ser calculadas como: (carbs_g × 4) + (protein_g × 4) + (fat_g × 9)
- A diferença entre as calorias calculadas e o campo "calories" NÃO pode exceder 5%.
- Se houver inconsistência, ajuste os macronutrientes para refletir a realidade física do alimento.

Alimento: "${foodDescription}"
Peso: ${weightGrams}g

FORMATO DE SAÍDA (OBRIGATÓRIO - APENAS JSON):
{
  "food_name": "nome padronizado",
  "weight_grams": ${weightGrams},
  "calories": número inteiro,
  "protein_g": número (máx 1 casa decimal),
  "carbs_g": número (máx 1 casa decimal),
  "fat_g": número (máx 1 casa decimal),
  "fiber_g": número (máx 1 casa decimal, opcional),
  "confidence": "alta" | "média" | "baixa",
  "notes": "explicação lógica breve"
}

Regras de Lógica:
1. Se o alimento é vago (ex: "frango"): Use valores para "Frango, peito, cozido" (padrão conservador) e marque confidence "média".
2. Se o preparo é explícito (ex: "frango frito"): Use valores específicos e marque confidence "alta".
3. Se fibra não for relevante ou confiável, omita fiber_g.

VALORES DE REFERÊNCIA (por 100g):
- Arroz branco cozido: ~130 kcal, 2.3g proteína, 28g carboidrato, 0.2g gordura
- Batata cozida: ~75 kcal, 1.5g proteína, 17g carboidrato, 0.1g gordura
- Alface: ~15 kcal, 1.2g proteína, 2.5g carboidrato, 0.2g gordura

Exemplo de resposta válida:
{"food_name":"Arroz branco cozido","weight_grams":150,"calories":195,"protein_g":3.5,"carbs_g":42.0,"fat_g":0.3,"confidence":"alta","notes":"Valores para arroz branco cozido"}`;
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

      // Validar que food_name não está vazio ou é inválido
      const foodName = parsed.food_name.trim();
      const invalidPatterns = [
        "não especificado",
        "nao especificado",
        "não encontrado",
        "nao encontrado",
        "discriminação",
        "discriminacao",
        "sexual",
        "chá",
        "cha",
      ];

      if (foodName.length === 0 || 
          invalidPatterns.some(pattern => foodName.toLowerCase().includes(pattern)) ||
          foodName.toLowerCase() === "alimento" ||
          foodName.length < 3 || // Nomes muito curtos como "ad", "doc" são provavelmente erros de parsing
          /^\d+$/.test(foodName)) {
        throw new Error(`Invalid food name returned: "${foodName}"`);
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

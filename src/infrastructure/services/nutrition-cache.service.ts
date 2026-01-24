/**
 * Serviço de Cache de Dados Nutricionais
 * 
 * Responsabilidades:
 * - Cachear resultados de nutrição para não fazer chamadas duplicadas ao Gemini
 * - Gerenciar TTL de cache
 * - Otimizar custo de API
 */

import { logger } from "@shared/logger/logger";
import type { ExtractedNutritionDto } from "@application/dtos/extracted-nutrition.dto";

interface CacheEntry<T> {
  readonly data: T;
  readonly expiresAt: number;
}

interface CacheStats {
  readonly hits: number;
  readonly misses: number;
  readonly size: number;
}

export class NutritionCacheService {
  private readonly cache = new Map<string, CacheEntry<ExtractedNutritionDto>>();
  private readonly ttlSeconds: number;
  private hits = 0;
  private misses = 0;

  constructor(ttlSeconds: number = 86400) {
    this.ttlSeconds = ttlSeconds;
  }

  /**
   * Gera chave de cache baseada no alimento e peso
   */
  private generateCacheKey(foodName: string, weightGrams: number): string {
    const normalized = foodName.toLowerCase().trim();
    return `${normalized}:${weightGrams}`;
  }

  /**
   * Recupera dados do cache se disponível e válido
   */
  get(foodName: string, weightGrams: number): ExtractedNutritionDto | null {
    const key = this.generateCacheKey(foodName, weightGrams);
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses += 1;
      return null;
    }

    const isExpired = Date.now() > entry.expiresAt;
    if (isExpired) {
      this.cache.delete(key);
      this.misses += 1;
      return null;
    }

    this.hits += 1;
    return entry.data;
  }

  /**
   * Armazena dados no cache com TTL
   */
  set(foodName: string, weightGrams: number, data: ExtractedNutritionDto): void {
    const key = this.generateCacheKey(foodName, weightGrams);
    const expiresAt = Date.now() + (this.ttlSeconds * 1000);

    this.cache.set(key, { data, expiresAt });

    logger.debug(
      { key, ttlSeconds: this.ttlSeconds, cacheSize: this.cache.size },
      "Nutrition data cached"
    );
  }

  /**
   * Limpa entrada específica do cache
   */
  invalidate(foodName: string, weightGrams: number): void {
    const key = this.generateCacheKey(foodName, weightGrams);
    this.cache.delete(key);
    logger.debug({ key }, "Cache entry invalidated");
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    const previousSize = this.cache.size;
    this.cache.clear();
    logger.info({ previousSize }, "Cache cleared");
  }

  /**
   * Retorna estatísticas de cache
   */
  getStats(): CacheStats {
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
    };
  }

  /**
   * Limpa entradas expiradas (pode ser chamado periodicamente)
   */
  cleanupExpired(): number {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      logger.debug(
        { cleanedCount: keysToDelete.length, cacheSize: this.cache.size },
        "Expired cache entries cleaned"
      );
    }

    return keysToDelete.length;
  }
}

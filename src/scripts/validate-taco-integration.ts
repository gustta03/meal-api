import { makeTacoClient } from "../infrastructure/factories/services/taco-client-factory";
import { makePacoRepository } from "../infrastructure/factories/repositories/paco-repository-factory";
import { logger } from "@shared/logger/logger";
import { CONFIG } from "@shared/constants/config.constants";

async function validateTacoIntegration(): Promise<void> {
  logger.info("=== Validação da Integração TACO ===");
  
  const useTacoApi = process.env.USE_TACO_API === "true" || process.env.TACO_API_URL !== undefined;
  const tacoApiUrl = process.env.TACO_API_URL || CONFIG.TACO.API_URL;
  
  logger.info({ useTacoApi, tacoApiUrl }, "Configuração detectada");

  if (!useTacoApi) {
    logger.warn("API TACO não está configurada. Configure USE_TACO_API=true ou TACO_API_URL");
    logger.info("Usando MongoDB como fallback");
    return;
  }

  // Teste 1: Verificar se a API está acessível
  logger.info("Teste 1: Verificando se a API TACO está acessível...");
  try {
    const tacoClient = makeTacoClient();
    
    // Teste simples: buscar um alimento conhecido
    const testFoodName = "arroz";
    logger.info({ testFoodName }, "Buscando alimento de teste");
    
    const food = await tacoClient.findByName(testFoodName);
    
    if (food) {
      logger.info({ food }, "✅ API TACO está acessível e retornando dados");
    } else {
      logger.warn("⚠️ API TACO está acessível mas não retornou dados para o teste");
      logger.info("Isso pode ser normal se o alimento não existir na base");
    }
  } catch (error) {
    logger.error({ error }, "❌ Falha ao acessar a API TACO");
    logger.error("Verifique se a API está rodando em: " + tacoApiUrl);
    process.exit(1);
  }

  // Teste 2: Verificar busca por nome
  logger.info("Teste 2: Testando busca por nome...");
  try {
    const tacoClient = makeTacoClient();
    const searchResults = await tacoClient.search("arroz", 5);
    
    if (searchResults.length > 0) {
      logger.info({ count: searchResults.length }, "✅ Busca por nome funcionando");
      logger.info({ firstResult: searchResults[0] }, "Exemplo de resultado");
    } else {
      logger.warn("⚠️ Busca não retornou resultados (pode ser normal)");
    }
  } catch (error) {
    logger.error({ error }, "❌ Falha na busca por nome");
    process.exit(1);
  }

  // Teste 3: Verificar repositório PACO
  logger.info("Teste 3: Testando repositório PACO...");
  try {
    const pacoRepository = makePacoRepository();
    const pacoItem = await pacoRepository.findByName("arroz");
    
    if (pacoItem) {
      logger.info({ pacoItem }, "✅ Repositório PACO funcionando corretamente");
      logger.info({
        id: pacoItem.id,
        nome: pacoItem.nome,
        energiaKcal: pacoItem.energiaKcal,
        proteinaG: pacoItem.proteinaG,
      }, "Dados do item encontrado");
    } else {
      logger.warn("⚠️ Repositório não encontrou o item (pode ser normal)");
    }
  } catch (error) {
    logger.error({ error }, "❌ Falha no repositório PACO");
    process.exit(1);
  }

  // Teste 4: Verificar busca no repositório
  logger.info("Teste 4: Testando busca no repositório...");
  try {
    const pacoRepository = makePacoRepository();
    const searchResults = await pacoRepository.search("arroz");
    
    if (searchResults.length > 0) {
      logger.info({ count: searchResults.length }, "✅ Busca no repositório funcionando");
    } else {
      logger.warn("⚠️ Busca não retornou resultados (pode ser normal)");
    }
  } catch (error) {
    logger.error({ error }, "❌ Falha na busca do repositório");
    process.exit(1);
  }

  // Teste 5: Verificar cálculo nutricional
  logger.info("Teste 5: Testando cálculo nutricional...");
  try {
    const pacoRepository = makePacoRepository();
    const pacoItem = await pacoRepository.findByName("arroz");
    
    if (pacoItem) {
      const nutrition = pacoItem.calculateNutritionForWeight(100);
      logger.info({ nutrition }, "✅ Cálculo nutricional funcionando");
      logger.info({
        pesoG: 100,
        kcal: nutrition.kcal,
        proteinaG: nutrition.proteinaG,
        carboidratoG: nutrition.carboidratoG,
        lipidioG: nutrition.lipidioG,
      }, "Valores calculados para 100g");
    } else {
      logger.warn("⚠️ Não foi possível testar cálculo (item não encontrado)");
    }
  } catch (error) {
    logger.error({ error }, "❌ Falha no cálculo nutricional");
    process.exit(1);
  }

  logger.info("=== Validação concluída com sucesso! ===");
  logger.info("A integração com a API TACO está funcionando corretamente.");
}

validateTacoIntegration()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error({ error }, "Erro durante a validação");
    process.exit(1);
  });


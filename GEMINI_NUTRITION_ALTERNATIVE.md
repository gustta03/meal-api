# 🤖 Alternativa: Usar Gemini para Macros Nutricionais

## 💡 Ideia Principal

Ao invés de buscar em API TACO/USDA, usar **Gemini** (que já temos integrado) para extrair dados nutricionais de alimentos descritos pelo usuário.

---

## 💰 Análise de Custo

### Pricing Gemini 2.0 Flash
- Input: $0.075 por 1M tokens
- Output: $0.30 por 1M tokens

### Custo por Chamada
```
Pergunta: "Qual é a nutrição de 150g de peito de frango grelhado?"
├─ Input: ~300 tokens → $0.0000225
├─ Output: ~150 tokens → $0.000045
└─ Total: $0.000068 por requisição ✅ MUITO BARATO
```

### Cenários de Custo Mensais

| Uso | Msg/dia | Custo/mês | Observação |
|-----|---------|-----------|-----------|
| Testador | 5 | $0.01 | Praticamente de graça |
| Casual | 20 | $0.04 | Insignificante |
| Moderado | 100 | $0.20 | Uma xícara de café |
| Pesado | 500 | $1.00 | Viável facilmente |
| Ultra | 1000 | $2.00 | Ainda mais barato que API paga |

**Conclusão:** ✅ **Viável! Custo é negligenciável.**

---

## 🎯 Comparativo: 3 Abordagens

### Opção 1: Manter TACO API (Status Quo)
```
Vantagens:
✅ Dados verificados
✅ Sem custo financeiro
✅ Consistência garantida

Desvantagens:
❌ Valores nutricionais incorretos
❌ Poucos alimentos (250)
❌ Não atualizado
❌ Não suporta alimentos caseiros
```

### Opção 2: Migrar para USDA FDC
```
Vantagens:
✅ Dados confiáveis (400K alimentos)
✅ Constantemente atualizado
✅ Gratuito
✅ Padrão internacional

Desvantagens:
❌ Nomes em inglês (precisa traduzir)
❌ Não suporta alimentos caseiros/regionais
❌ Uma API externa a mais
❌ Implementação necessária
```

### Opção 3: Usar Gemini para Macros ⭐ NOVA
```
Vantagens:
✅ Custo negligenciável ($0.20-$1/mês)
✅ Suporta alimentos caseiros
✅ Suporta receitas customizadas
✅ Já temos integrado
✅ Respostas em PT-BR naturalmente
✅ Flexível para variações (frito, grelhado, etc)
✅ Sem dependência externa de API

Desvantagens:
❌ Precisão pode variar
❌ Não é laboratório-verificado
❌ Requer prompts bem estruturados
```

---

## 📊 Estratégia Híbrida Recomendada

**Usar Gemini + Cache + Verificação:**

```typescript
// Fluxo Híbrido Inteligente

async function getNutritionData(foodName: string, weight: number) {
  // 1. Verificar cache (alimentos conhecidos)
  const cached = cache.get(`${foodName}_${weight}`);
  if (cached) return cached;

  // 2. Tentar buscar no TACO/USDA (base confiável)
  const official = await tacoApi.search(foodName);
  if (official && official.confidence > 0.8) {
    cache.set(`${foodName}_${weight}`, official);
    return official;
  }

  // 3. Fallback para Gemini (alimentos não catalogados)
  const geminiResult = await gemini.extractNutrition(foodName, weight);
  
  // 4. Validar resultado do Gemini
  if (isReasonable(geminiResult)) {
    cache.set(`${foodName}_${weight}`, {
      ...geminiResult,
      source: "gemini",
      confidence: "média"
    });
    return geminiResult;
  }

  // 5. Pedir confirmação ao usuário
  return {
    estimated: geminiResult,
    needsConfirmation: true
  };
}
```

---

## 🛠️ Implementação Completa para Gemini

### 1. Serviço Gemini para Nutrição

```typescript
// src/infrastructure/gemini/gemini-nutrition.service.ts

export class GeminiNutritionService {
  constructor(private readonly gemini: GeminiService) {}

  async extractNutritionFromDescription(
    foodDescription: string,
    weight: number
  ): Promise<NutritionData> {
    const prompt = `
Você é um nutricionista especialista. Analise a descrição de alimento e forneça dados nutricionais precisos.

Alimento: "${foodDescription}"
Peso: ${weight}g

Forneça APENAS um JSON válido (sem markdown, sem explicação):
{
  "food_name": "nome padronizado",
  "weight_grams": ${weight},
  "calories": número,
  "protein_g": número,
  "carbs_g": número,
  "fat_g": número,
  "fiber_g": número,
  "confidence": "alta" | "média" | "baixa",
  "notes": "observações (ex: se frito vs grelhado)"
}

Regras:
1. Se o alimento é vago (ex: "frango"), assuma grelhado/cozido comum
2. Se é específico (ex: "frango frito"), use dados para essa preparação
3. Priorize dados de alimentos brasileiros/comuns
4. Seja conservador em macros (melhor subestimar que superestimar)
`;

    const response = await this.gemini.askJson(prompt);
    return this.validateNutritionData(response);
  }

  private validateNutritionData(data: any): NutritionData {
    // Validar se valores fazem sentido
    if (data.calories < 0 || data.calories > 10000) {
      throw new Error("Calorie value unreasonable");
    }
    if (data.protein_g < 0 || data.carbs_g < 0 || data.fat_g < 0) {
      throw new Error("Negative macro values");
    }
    return data;
  }
}
```

### 2. Atualizar Repositório PACO

```typescript
// src/infrastructure/repositories/gemini-paco.repository.ts

export class GeminiPacoRepository implements IPacoRepository {
  constructor(
    private readonly geminiNutrition: GeminiNutritionService,
    private readonly cache: CacheService
  ) {}

  async findByName(name: string, weight: number = 100): Promise<PacoItem | null> {
    const cacheKey = `${name}_${weight}`;
    
    // Verificar cache
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    // Buscar via Gemini
    const nutrition = await this.geminiNutrition.extractNutritionFromDescription(
      name,
      weight
    );

    const pacoItem: PacoItem = {
      id: generateUUID(),
      nome: nutrition.food_name,
      energiaKcal: nutrition.calories,
      proteinaG: nutrition.protein_g,
      carboidratoG: nutrition.carbs_g,
      lipidioG: nutrition.fat_g,
      porcaoPadraoG: weight,
      unidade: "g",
      source: "gemini",
      confidence: nutrition.confidence,
    };

    // Cachear resultado
    this.cache.set(cacheKey, pacoItem, 24 * 60 * 60); // 24h

    return pacoItem;
  }
}
```

### 3. Integração com Factory

```typescript
// src/infrastructure/factories/repositories/paco-repository-factory.ts

export function createPacoRepository(): IPacoRepository {
  const strategy = process.env.NUTRITION_DATA_SOURCE || "gemini";

  switch (strategy) {
    case "gemini":
      return new GeminiPacoRepository(
        new GeminiNutritionService(geminiService),
        new InMemoryCache()
      );
    case "usda":
      return new USDAFDCPacoRepository(new USDAFDCClient());
    case "taco":
      return new TacoApiPacoRepository(new TacoGraphQLClient());
    case "mongodb":
    default:
      return new MongoDBPacoRepository();
  }
}
```

### 4. Configuração .env

```bash
# Estratégia para dados nutricionais
# Opções: gemini | usda | taco | mongodb
NUTRITION_DATA_SOURCE=gemini

# Cache (em segundos)
NUTRITION_CACHE_TTL=86400
```

---

## 🧪 Exemplos de Uso

### Exemplo 1: Alimento Comum (High Confidence)

```
Usuário: "150g de peito de frango grelhado"

Gemini Response:
{
  "food_name": "Frango, peito, sem pele, grelhado",
  "weight_grams": 150,
  "calories": 247,
  "protein_g": 47,
  "carbs_g": 0,
  "fat_g": 5,
  "confidence": "alta"
}

Resultado: ✅ Excelente
```

### Exemplo 2: Alimento Caseiro (Medium Confidence)

```
Usuário: "Uma tigela de risoto de cogumelo feito em casa"

Gemini Response:
{
  "food_name": "Risoto de cogumelo caseiro",
  "weight_grams": 250,
  "calories": 312,
  "protein_g": 8,
  "carbs_g": 45,
  "fat_g": 12,
  "confidence": "média",
  "notes": "Estimativa baseada em ingredientes típicos"
}

Resultado: ⚠️ Pedir confirmação
Mensagem: "Estimei ~312 kcal para sua porção. Pode estar diferente dependendo dos ingredientes exatos. Confirma?"
```

### Exemplo 3: Alimento Vago (Low Confidence)

```
Usuário: "Um prato de comida"

Gemini Response:
{
  "error": true,
  "message": "Descrição muito vaga"
}

Resultado: ❌ Pedir detalhes
Mensagem: "Descreva melhor o alimento (ex: frango grelhado, quantidade aproximada)"
```

---

## 🎯 Matriz de Decisão

```
         ↓ Precisão
         Alta        Média        Baixa
Custo │
Alto  │ USDA FDC    ❌         ❌
Baixo │ ✅GEMINI    ✅GEMINI   Gemini+Confirm
Grátis│ TACO(broken)✅GEMINI   ✅GEMINI
```

**Recomendação:** Use **Gemini** como padrão!

---

## ⚖️ Quando usar cada abordagem

### Use Gemini quando:
- ✅ Alimento caseiro/receita customizada
- ✅ Alimento regional/brasileiro
- ✅ Variação específica (frito vs grelhado)
- ✅ Quer suporte múltiplas linguagens
- ✅ Custo é prioridade

### Use USDA quando:
- ✅ Precisão máxima é crítica
- ✅ Alimento americano/internacional padrão
- ✅ Volume muito alto (>10k requisições/dia)

### Use TACO quando:
- ✅ Valores forem corrigidos
- ✅ Offline é requerimento
- ✅ Zero custo é absoluto

---

## 📋 Implementação Sugerida

### Fase 1: Testar Gemini (1-2h)
- [ ] Criar GeminiNutritionService
- [ ] Testar 50 alimentos comuns
- [ ] Comparar com valores conhecidos
- [ ] Medir accuracy

### Fase 2: Integrar com Cache (1-2h)
- [ ] Implementar cache in-memory
- [ ] Adicionar TTL configurável
- [ ] Fallback para DB

### Fase 3: Deploy Gradual (2-3h)
- [ ] A/B test: 10% Gemini, 90% TACO
- [ ] Monitorar feedback de usuários
- [ ] Aumentar % gradualmente

### Fase 4: Validação (2-3h)
- [ ] Colher feedback
- [ ] Ajustar prompts
- [ ] Documentar resultados

---

## 🚀 Próximas Etapas

**Qual você prefere?**

1. ⭐ **Implementar Gemini agora** (meu voto!)
   - Custo: Negligenciável
   - Tempo: 8-10h
   - Benefício: Máximo

2. **Migrar para USDA FDC**
   - Custo: Desenvolvimento
   - Tempo: 12-16h
   - Benefício: Precisão

3. **Abordagem Híbrida**
   - Gemini + Cache + USDA Fallback
   - Custo: Desenvolvimento médio
   - Tempo: 20h+
   - Benefício: Máximo em tudo

**Minha recomendação:** Comece com Gemini! É o mais viável agora e pode integrar com USDA depois se necessário.

---

**Última atualização:** 2026-01-24

import { MongoDBConnection } from "../infrastructure/database/mongodb.connection";
import { PacoItem } from "../domain/entities/paco-item.entity";
import { DATABASE } from "../shared/constants/database.constants";
import { logger } from "../shared/logger/logger";
import { generateUUID } from "../shared/utils/uuid";

interface PacoSeedData {
  nome: string;
  energiaKcal: number;
  proteinaG: number;
  carboidratoG: number;
  lipidioG: number;
  porcaoPadraoG: number;
  unidade: "g" | "ml";
  nomeAlternativo?: string[];
}

const PACO_SEED_DATA: PacoSeedData[] = [
  {
    nome: "Arroz branco cozido",
    energiaKcal: 128,
    proteinaG: 2.5,
    carboidratoG: 28.0,
    lipidioG: 0.2,
    porcaoPadraoG: 100,
    unidade: "g",
    nomeAlternativo: ["arroz", "arroz cozido"],
  },
  {
    nome: "Frango grelhado",
    energiaKcal: 165,
    proteinaG: 31.0,
    carboidratoG: 0.0,
    lipidioG: 3.6,
    porcaoPadraoG: 100,
    unidade: "g",
    nomeAlternativo: ["frango", "peito de frango", "frango grelhado"],
  },
  {
    nome: "Ovo de galinha",
    energiaKcal: 155,
    proteinaG: 13.0,
    carboidratoG: 1.1,
    lipidioG: 10.6,
    porcaoPadraoG: 100,
    unidade: "g",
    nomeAlternativo: ["ovo", "ovos"],
  },
  {
    nome: "Leite integral",
    energiaKcal: 61,
    proteinaG: 3.1,
    carboidratoG: 4.7,
    lipidioG: 3.3,
    porcaoPadraoG: 100,
    unidade: "ml",
    nomeAlternativo: ["leite", "leite de vaca"],
  },
  {
    nome: "Banana prata",
    energiaKcal: 98,
    proteinaG: 1.3,
    carboidratoG: 26.0,
    lipidioG: 0.1,
    porcaoPadraoG: 100,
    unidade: "g",
    nomeAlternativo: ["banana"],
  },
  {
    nome: "Batata doce cozida",
    energiaKcal: 77,
    proteinaG: 0.6,
    carboidratoG: 18.4,
    lipidioG: 0.1,
    porcaoPadraoG: 100,
    unidade: "g",
    nomeAlternativo: ["batata doce", "batata-doce"],
  },
  {
    nome: "Queijo minas frescal",
    energiaKcal: 264,
    proteinaG: 17.4,
    carboidratoG: 3.2,
    lipidioG: 20.2,
    porcaoPadraoG: 100,
    unidade: "g",
    nomeAlternativo: ["queijo", "queijo minas", "queijo fresco"],
  },
  {
    nome: "Aveia em flocos",
    energiaKcal: 394,
    proteinaG: 13.9,
    carboidratoG: 66.6,
    lipidioG: 8.5,
    porcaoPadraoG: 100,
    unidade: "g",
    nomeAlternativo: ["aveia"],
  },
  {
    nome: "Salmão grelhado",
    energiaKcal: 211,
    proteinaG: 30.0,
    carboidratoG: 0.0,
    lipidioG: 9.0,
    porcaoPadraoG: 100,
    unidade: "g",
    nomeAlternativo: ["salmão", "salmao"],
  },
  {
    nome: "Brócolis cozido",
    energiaKcal: 25,
    proteinaG: 2.1,
    carboidratoG: 4.4,
    lipidioG: 0.2,
    porcaoPadraoG: 100,
    unidade: "g",
    nomeAlternativo: ["brócolis", "brocolis"],
  },
  {
    nome: "Pão de forma",
    energiaKcal: 253,
    proteinaG: 9.4,
    carboidratoG: 49.7,
    lipidioG: 3.1,
    porcaoPadraoG: 100,
    unidade: "g",
    nomeAlternativo: ["pão", "pao", "pão de forma"],
  },
  {
    nome: "Azeite de oliva",
    energiaKcal: 884,
    proteinaG: 0.0,
    carboidratoG: 0.0,
    lipidioG: 100.0,
    porcaoPadraoG: 100,
    unidade: "ml",
    nomeAlternativo: ["azeite", "azeite de oliva"],
  },
  {
    nome: "Suco de laranja",
    energiaKcal: 45,
    proteinaG: 0.7,
    carboidratoG: 10.4,
    lipidioG: 0.1,
    porcaoPadraoG: 100,
    unidade: "ml",
    nomeAlternativo: ["suco de laranja", "laranja", "suco"],
  },
  {
    nome: "Iogurte natural",
    energiaKcal: 59,
    proteinaG: 4.0,
    carboidratoG: 3.4,
    lipidioG: 3.3,
    porcaoPadraoG: 100,
    unidade: "g",
    nomeAlternativo: ["iogurte", "yogurt"],
  },
  {
    nome: "Feijão preto cozido",
    energiaKcal: 77,
    proteinaG: 4.5,
    carboidratoG: 14.0,
    lipidioG: 0.5,
    porcaoPadraoG: 100,
    unidade: "g",
    nomeAlternativo: ["feijão", "feijao", "feijão preto"],
  },
];

async function seedPaco(): Promise<void> {
  try {
    logger.info("Starting PACO seed...");

    const connection = MongoDBConnection.getInstance();
    await connection.connect();

    const db = connection.getDatabase();
    const collection = db.collection(DATABASE.COLLECTIONS.PACO_ITEMS);

    const existingCount = await collection.countDocuments();
    if (existingCount > 0) {
      logger.warn({ count: existingCount }, "PACO collection already has data. Clearing...");
      await collection.deleteMany({});
    }

    const pacoItems: PacoItem[] = PACO_SEED_DATA.map((data) =>
      PacoItem.create(
        generateUUID(),
        data.nome,
        data.energiaKcal,
        data.proteinaG,
        data.carboidratoG,
        data.lipidioG,
        data.porcaoPadraoG,
        data.unidade,
        data.nomeAlternativo
      )
    );

    const documents = pacoItems.map((item) => ({
      _id: item.id as any,
      nome: item.nome,
      nomeAlternativo: item.nomeAlternativo,
      energiaKcal: item.energiaKcal,
      proteinaG: item.proteinaG,
      carboidratoG: item.carboidratoG,
      lipidioG: item.lipidioG,
      porcaoPadraoG: item.porcaoPadraoG,
      unidade: item.unidade,
    }));

    await collection.insertMany(documents as any);

    logger.info({ count: pacoItems.length }, "PACO seed completed successfully");
    await connection.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error({ error }, "Failed to seed PACO");
    process.exit(1);
  }
}

seedPaco();


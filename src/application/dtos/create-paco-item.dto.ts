export interface CreatePacoItemDto {
  name: string;
  energyKcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  standardPortionG: number;
  unit: "g" | "ml";
  alternativeNames?: string[];
}


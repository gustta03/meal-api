export interface PacoItemResponseDto {
  id: string;
  name: string;
  energyKcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  standardPortionG: number;
  unit: "g" | "ml";
  alternativeNames?: string[];
}


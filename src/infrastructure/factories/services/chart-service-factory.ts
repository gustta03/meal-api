import { ChartService } from "@infrastructure/services/chart.service";

export function createChartService(): ChartService {
  return new ChartService();
}


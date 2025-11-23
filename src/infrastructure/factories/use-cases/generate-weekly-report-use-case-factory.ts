import { GenerateWeeklyReportUseCase } from "@application/use-cases/generate-weekly-report.use-case";
import { createGetWeeklyReportUseCase } from "./get-weekly-report-use-case-factory";
import { createChartService } from "../services/chart-service-factory";

export function createGenerateWeeklyReportUseCase(): GenerateWeeklyReportUseCase {
  const getWeeklyReportUseCase = createGetWeeklyReportUseCase();
  const chartService = createChartService();
  return new GenerateWeeklyReportUseCase(getWeeklyReportUseCase, chartService);
}


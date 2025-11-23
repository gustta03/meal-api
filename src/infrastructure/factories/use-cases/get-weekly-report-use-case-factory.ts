import { GetWeeklyReportUseCase } from "@application/use-cases/get-weekly-report.use-case";
import { makeMealRepository } from "../repositories/meal-repository-factory";

export function createGetWeeklyReportUseCase(): GetWeeklyReportUseCase {
  const mealRepository = makeMealRepository();
  return new GetWeeklyReportUseCase(mealRepository);
}


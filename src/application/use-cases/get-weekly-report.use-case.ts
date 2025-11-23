import { IMealRepository } from "@domain/repositories/meal.repository";
import { Result, success, failure } from "@shared/types/result";
import { logger } from "@shared/logger/logger";
import { REPORT } from "@shared/constants/report.constants";
import { ERROR_MESSAGES } from "@shared/constants/error-messages.constants";

export interface WeeklyReportDayDto {
  date: string;
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  mealCount: number;
}

export interface WeeklyReportDto {
  startDate: string;
  endDate: string;
  days: WeeklyReportDayDto[];
  weeklyTotals: {
    kcal: number;
    proteinG: number;
    carbG: number;
    fatG: number;
    averageKcal: number;
    averageProteinG: number;
    averageCarbG: number;
    averageFatG: number;
  };
}

export class GetWeeklyReportUseCase {
  constructor(private readonly mealRepository: IMealRepository) {}

  async execute(userId: string, startDate?: Date): Promise<Result<WeeklyReportDto, string>> {
    try {
      const weekStart = this.getWeekStart(startDate || new Date());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + REPORT.DAYS_IN_WEEK - 1);
      weekEnd.setHours(23, 59, 59, 999);

      const meals = await this.mealRepository.findByUserIdAndDateRange(userId, weekStart, weekEnd);

      const daysMap = new Map<string, WeeklyReportDayDto>();

      for (let i = 0; i < REPORT.DAYS_IN_WEEK; i++) {
        const currentDate = new Date(weekStart);
        currentDate.setDate(currentDate.getDate() + i);
        const dateKey = currentDate.toISOString().split("T")[0];
        
        daysMap.set(dateKey, {
          date: dateKey,
          kcal: 0,
          proteinG: 0,
          carbG: 0,
          fatG: 0,
          mealCount: 0,
        });
      }

      meals.forEach((meal) => {
        const dateKey = meal.date.toISOString().split("T")[0];
        const dayData = daysMap.get(dateKey);
        
        if (dayData) {
          dayData.kcal += meal.totals.kcal;
          dayData.proteinG += meal.totals.proteinG;
          dayData.carbG += meal.totals.carbG;
          dayData.fatG += meal.totals.fatG;
          dayData.mealCount += 1;
        }
      });

      const days = Array.from(daysMap.values()).map((day) => ({
        ...day,
        kcal: Math.round(day.kcal * 100) / 100,
        proteinG: Math.round(day.proteinG * 100) / 100,
        carbG: Math.round(day.carbG * 100) / 100,
        fatG: Math.round(day.fatG * 100) / 100,
      }));

      const weeklyTotals = {
        kcal: 0,
        proteinG: 0,
        carbG: 0,
        fatG: 0,
        averageKcal: 0,
        averageProteinG: 0,
        averageCarbG: 0,
        averageFatG: 0,
      };

      days.forEach((day) => {
        weeklyTotals.kcal += day.kcal;
        weeklyTotals.proteinG += day.proteinG;
        weeklyTotals.carbG += day.carbG;
        weeklyTotals.fatG += day.fatG;
      });

      const daysWithMeals = days.filter((day) => day.mealCount > 0).length || 1;
      
      weeklyTotals.averageKcal = Math.round((weeklyTotals.kcal / daysWithMeals) * 100) / 100;
      weeklyTotals.averageProteinG = Math.round((weeklyTotals.proteinG / daysWithMeals) * 100) / 100;
      weeklyTotals.averageCarbG = Math.round((weeklyTotals.carbG / daysWithMeals) * 100) / 100;
      weeklyTotals.averageFatG = Math.round((weeklyTotals.fatG / daysWithMeals) * 100) / 100;

      weeklyTotals.kcal = Math.round(weeklyTotals.kcal * 100) / 100;
      weeklyTotals.proteinG = Math.round(weeklyTotals.proteinG * 100) / 100;
      weeklyTotals.carbG = Math.round(weeklyTotals.carbG * 100) / 100;
      weeklyTotals.fatG = Math.round(weeklyTotals.fatG * 100) / 100;

      return success({
        startDate: weekStart.toISOString().split("T")[0],
        endDate: weekEnd.toISOString().split("T")[0],
        days,
        weeklyTotals,
      });
    } catch (error) {
      logger.error({ error, userId, startDate }, "Failed to get weekly report");
      const errorMessage = error instanceof Error 
        ? error.message 
        : ERROR_MESSAGES.REPORT?.WEEKLY_FAILED || "Failed to get weekly report";
      return failure(errorMessage);
    }
  }

  private getWeekStart(date: Date): Date {
    const weekStart = new Date(date);
    const dayOfWeek = weekStart.getDay();
    const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }
}


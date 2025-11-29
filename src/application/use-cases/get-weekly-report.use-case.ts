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
      const referenceDate = startDate || new Date();
      const weekStart = this.getWeekStart(referenceDate);
      
      const calculatedWeekEnd = new Date(weekStart);
      calculatedWeekEnd.setDate(calculatedWeekEnd.getDate() + REPORT.DAYS_IN_WEEK - 1);
      
      const today = new Date(referenceDate);
      today.setHours(0, 0, 0, 0);
      
      const reportEndDate = today < calculatedWeekEnd ? today : calculatedWeekEnd;
      const reportEndDateWithTime = new Date(reportEndDate);
      reportEndDateWithTime.setHours(23, 59, 59, 999);
      
      const todayDateKey = this._getDateKey(today);

      logger.debug({
        userId,
        weekStart: weekStart.toISOString(),
        reportEndDateWithTime: reportEndDateWithTime.toISOString(),
        weekStartDateKey: this._getDateKey(weekStart),
        reportEndDateKey: this._getDateKey(reportEndDate),
        todayDateKey: this._getDateKey(today),
      }, "Getting weekly report - date range");

      const meals = await this.mealRepository.findByUserIdAndDateRange(userId, weekStart, reportEndDateWithTime);

      logger.debug({
        userId,
        mealsCount: meals.length,
        mealDates: meals.map((meal) => ({
          date: meal.date instanceof Date ? meal.date.toISOString() : String(meal.date),
          dateKey: this._getDateKey(meal.date),
          kcal: meal.totals.kcal,
        })),
      }, "Meals found for weekly report");

      const daysMap = new Map<string, WeeklyReportDayDto>();

      for (let i = 0; i < REPORT.DAYS_IN_WEEK; i++) {
        const dayDate = new Date(weekStart);
        dayDate.setDate(dayDate.getDate() + i);
        dayDate.setHours(0, 0, 0, 0);
        const dateKey = this._getDateKey(dayDate);
        
        daysMap.set(dateKey, {
          date: dateKey,
          kcal: 0,
          proteinG: 0,
          carbG: 0,
          fatG: 0,
          mealCount: 0,
        });
      }
      
      logger.debug({
        userId,
        daysMapKeys: Array.from(daysMap.keys()).sort(),
        todayDateKey,
        reportEndDateKey: this._getDateKey(reportEndDate),
        isTodayInMap: daysMap.has(todayDateKey),
        weekStartDateKey: this._getDateKey(weekStart),
      }, "Days map created for weekly report");

      logger.debug({
        userId,
        daysMapKeys: Array.from(daysMap.keys()),
      }, "Days map created for weekly report");

      meals.forEach((meal) => {
        const mealDate = meal.date instanceof Date ? new Date(meal.date) : new Date(meal.date);
        const dateKey = this._getDateKey(mealDate);
        const dayData = daysMap.get(dateKey);
        
        if (dayData) {
          dayData.kcal += meal.totals.kcal;
          dayData.proteinG += meal.totals.proteinG;
          dayData.carbG += meal.totals.carbG;
          dayData.fatG += meal.totals.fatG;
          dayData.mealCount += 1;
          
          logger.debug({
            mealId: meal.id,
            dateKey,
            mealKcal: meal.totals.kcal,
            dayKcalAfter: dayData.kcal,
          }, "Meal added to day");
        } else {
          logger.warn({
            mealId: meal.id,
            mealDate: mealDate.toISOString(),
            dateKey,
            availableKeys: Array.from(daysMap.keys()),
            weekStart: this._getDateKey(weekStart),
            reportEndDate: this._getDateKey(reportEndDate),
          }, "Meal date not found in days map - meal will be skipped");
        }
      });

      const days = Array.from(daysMap.values())
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((day) => ({
          ...day,
          kcal: Math.round(day.kcal * 100) / 100,
          proteinG: Math.round(day.proteinG * 100) / 100,
          carbG: Math.round(day.carbG * 100) / 100,
          fatG: Math.round(day.fatG * 100) / 100,
        }));

      logger.debug({
        userId,
        daysSummary: days.map((day) => ({
          date: day.date,
          kcal: day.kcal,
          mealCount: day.mealCount,
        })),
      }, "Weekly report days summary");

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
        startDate: this._getDateKey(weekStart),
        endDate: this._getDateKey(reportEndDate),
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

  private _getDateKey(date: Date): string {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    const year = normalizedDate.getFullYear();
    const month = String(normalizedDate.getMonth() + 1).padStart(2, "0");
    const day = String(normalizedDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}


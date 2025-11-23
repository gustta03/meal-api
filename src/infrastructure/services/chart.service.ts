import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { WeeklyReportDto } from "@application/use-cases/get-weekly-report.use-case";
import { REPORT } from "@shared/constants/report.constants";
import { ERROR_MESSAGES } from "@shared/constants/error-messages.constants";
import { logger } from "@shared/logger/logger";

export interface IChartService {
  generateWeeklyNutritionChart(report: WeeklyReportDto): Promise<Buffer>;
}

export class ChartService implements IChartService {
  private readonly chartJSNodeCanvas: ChartJSNodeCanvas;

  constructor() {
    this.chartJSNodeCanvas = new ChartJSNodeCanvas({
      width: REPORT.CHART.WIDTH,
      height: REPORT.CHART.HEIGHT,
      backgroundColour: "white",
    });
  }

  async generateWeeklyNutritionChart(report: WeeklyReportDto): Promise<Buffer> {
    try {
      const labels = report.days.map((day) => {
        const date = new Date(day.date);
        const dayName = date.toLocaleDateString("pt-BR", { weekday: "short" });
        const dayNumber = date.getDate();
        return `${dayName} ${dayNumber}`;
      });

      const caloriesData = report.days.map((day) => day.kcal);
      const proteinData = report.days.map((day) => day.proteinG);
      const carbsData = report.days.map((day) => day.carbG);

      const configuration = {
        type: "line" as const,
        data: {
          labels,
          datasets: [
            {
              label: "Calorias (kcal)",
              data: caloriesData,
              borderColor: REPORT.CHART.COLORS.CALORIES,
              backgroundColor: `${REPORT.CHART.COLORS.CALORIES}33`,
              tension: 0.4,
              yAxisID: "y",
            },
            {
              label: "Proteína (g)",
              data: proteinData,
              borderColor: REPORT.CHART.COLORS.PROTEIN,
              backgroundColor: `${REPORT.CHART.COLORS.PROTEIN}33`,
              tension: 0.4,
              yAxisID: "y1",
            },
            {
              label: "Carboidrato (g)",
              data: carbsData,
              borderColor: REPORT.CHART.COLORS.CARBS,
              backgroundColor: `${REPORT.CHART.COLORS.CARBS}33`,
              tension: 0.4,
              yAxisID: "y1",
            },
          ],
        },
        options: {
          responsive: true,
          interaction: {
            mode: "index" as const,
            intersect: false,
          },
          plugins: {
            title: {
              display: true,
              text: `Relatório Semanal de Nutrição - ${report.startDate} a ${report.endDate}`,
              font: {
                size: 18,
                weight: "bold" as const,
              },
            },
            legend: {
              display: true,
              position: "top" as const,
            },
          },
          scales: {
            y: {
              type: "linear" as const,
              display: true,
              position: "left" as const,
              title: {
                display: true,
                text: "Calorias (kcal)",
              },
            },
            y1: {
              type: "linear" as const,
              display: true,
              position: "right" as const,
              title: {
                display: true,
                text: "Proteína e Carboidrato (g)",
              },
              grid: {
                drawOnChartArea: false,
              },
            },
          },
        },
      };

      const imageBuffer = await this.chartJSNodeCanvas.renderToBuffer(configuration);
      return imageBuffer;
    } catch (error) {
      logger.error({ error, report }, "Failed to generate weekly nutrition chart");
      throw new Error(ERROR_MESSAGES.REPORT.CHART_GENERATION_FAILED);
    }
  }
}


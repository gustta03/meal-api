import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { createCanvas, loadImage, CanvasRenderingContext2D } from "canvas";
import { WeeklyReportDto } from "@application/use-cases/get-weekly-report.use-case";
import { REPORT } from "@shared/constants/report.constants";
import { ERROR_MESSAGES } from "@shared/constants/error-messages.constants";
import { logger } from "@shared/logger/logger";

export interface IChartService {
  generateWeeklyNutritionChart(report: WeeklyReportDto): Promise<Buffer>;
  generateWeeklyChartWithProgressBars(
    report: WeeklyReportDto,
    goalCalories: number
  ): Promise<Buffer>;
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
              borderWidth: 3,
              pointRadius: 6,
              pointHoverRadius: 8,
              pointBackgroundColor: REPORT.CHART.COLORS.CALORIES,
              pointBorderColor: "#FFFFFF",
              pointBorderWidth: 2,
              tension: 0.4,
              fill: true,
              yAxisID: "y",
            },
            {
              label: "Proteína (g)",
              data: proteinData,
              borderColor: REPORT.CHART.COLORS.PROTEIN,
              backgroundColor: `${REPORT.CHART.COLORS.PROTEIN}33`,
              borderWidth: 3,
              pointRadius: 6,
              pointHoverRadius: 8,
              pointBackgroundColor: REPORT.CHART.COLORS.PROTEIN,
              pointBorderColor: "#FFFFFF",
              pointBorderWidth: 2,
              tension: 0.4,
              fill: true,
              yAxisID: "y1",
            },
            {
              label: "Carboidrato (g)",
              data: carbsData,
              borderColor: REPORT.CHART.COLORS.CARBS,
              backgroundColor: `${REPORT.CHART.COLORS.CARBS}33`,
              borderWidth: 3,
              pointRadius: 6,
              pointHoverRadius: 8,
              pointBackgroundColor: REPORT.CHART.COLORS.CARBS,
              pointBorderColor: "#FFFFFF",
              pointBorderWidth: 2,
              tension: 0.4,
              fill: true,
              yAxisID: "y1",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: "index" as const,
            intersect: false,
          },
          plugins: {
            title: {
              display: true,
              text: `Relatório Semanal de Nutrição - ${report.startDate} a ${report.endDate}`,
              font: {
                size: 20,
                weight: "bold" as const,
                family: "Arial",
              },
              padding: {
                top: 10,
                bottom: 20,
              },
            },
            legend: {
              display: true,
              position: "top" as const,
              labels: {
                padding: 15,
                font: {
                  size: 14,
                  weight: "normal" as const,
                },
                usePointStyle: true,
                pointStyle: "circle",
              },
            },
            tooltip: {
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              padding: 12,
              titleFont: {
                size: 14,
                weight: "bold" as const,
              },
              bodyFont: {
                size: 13,
              },
              borderColor: "rgba(255, 255, 255, 0.1)",
              borderWidth: 1,
              cornerRadius: 8,
            },
          },
          scales: {
            x: {
              grid: {
                display: true,
                color: "rgba(0, 0, 0, 0.05)",
                lineWidth: 1,
              },
              ticks: {
                font: {
                  size: 12,
                },
                padding: 10,
              },
            },
            y: {
              type: "linear" as const,
              display: true,
              position: "left" as const,
              title: {
                display: true,
                text: "Calorias (kcal)",
                font: {
                  size: 14,
                  weight: "bold" as const,
                },
                padding: {
                  top: 10,
                  bottom: 10,
                },
              },
              grid: {
                display: true,
                color: "rgba(0, 0, 0, 0.05)",
                lineWidth: 1,
              },
              ticks: {
                font: {
                  size: 11,
                },
                padding: 8,
              },
              beginAtZero: true,
            },
            y1: {
              type: "linear" as const,
              display: true,
              position: "right" as const,
              title: {
                display: true,
                text: "Proteína e Carboidrato (g)",
                font: {
                  size: 14,
                  weight: "bold" as const,
                },
                padding: {
                  top: 10,
                  bottom: 10,
                },
              },
              grid: {
                drawOnChartArea: false,
              },
              ticks: {
                font: {
                  size: 11,
                },
                padding: 8,
              },
              beginAtZero: true,
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

  async generateWeeklyChartWithProgressBars(
    report: WeeklyReportDto,
    goalCalories: number
  ): Promise<Buffer> {
    try {
      const chartImage = await this.generateWeeklyNutritionChart(report);
      const chartImg = await loadImage(chartImage);

      const progressBarsSectionHeight = this._calculateProgressBarsHeight(report.days.length);
      const combinedHeight = REPORT.CHART.HEIGHT + progressBarsSectionHeight;
      
      const combinedCanvas = createCanvas(REPORT.CHART.WIDTH, combinedHeight);
      const ctx = combinedCanvas.getContext("2d");

      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, REPORT.CHART.WIDTH, combinedHeight);

      ctx.drawImage(chartImg, 0, 0);

      const progressBarsY = REPORT.CHART.HEIGHT;
      this._drawProgressBars(ctx, report, goalCalories, progressBarsY);

      return combinedCanvas.toBuffer("image/png");
    } catch (error) {
      logger.error({ error, report, goalCalories }, "Failed to generate weekly chart with progress bars");
      throw new Error(ERROR_MESSAGES.REPORT.CHART_GENERATION_FAILED);
    }
  }

  private _calculateProgressBarsHeight(daysCount: number): number {
    const barsPerRow = 2;
    const rows = Math.ceil(daysCount / barsPerRow);
    const barHeight = 120;
    const padding = 20;
    const titleHeight = 40;
    return titleHeight + (rows * barHeight) + ((rows - 1) * padding) + (padding * 2);
  }

  private _drawProgressBars(
    ctx: CanvasRenderingContext2D,
    report: WeeklyReportDto,
    goalCalories: number,
    startY: number
  ): void {
    const padding = 20;
    const barWidth = (REPORT.CHART.WIDTH - (padding * 3)) / 2;
    const barHeight = 100;
    const barsPerRow = 2;
    const spacing = padding;

    ctx.fillStyle = "#1F2937";
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("Progresso Diário em Relação à Meta", REPORT.CHART.WIDTH / 2, startY + padding);

    const titleHeight = 50;
    let currentY = startY + titleHeight + padding;

    report.days.forEach((day, index) => {
      const row = Math.floor(index / barsPerRow);
      const col = index % barsPerRow;
      
      const x = padding + (col * (barWidth + spacing));
      const y = currentY + (row * (barHeight + spacing));

      this._drawSingleProgressBar(ctx, day, goalCalories, x, y, barWidth, barHeight);
    });
  }

  private _drawSingleProgressBar(
    ctx: CanvasRenderingContext2D,
    day: { date: string; kcal: number },
    goalCalories: number,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    const percentage = Math.min((day.kcal / goalCalories) * 100, 100);
    const barPadding = 10;
    const barInnerWidth = width - (barPadding * 2);
    const barInnerHeight = 40;
    const barY = y + 50;

    const date = new Date(day.date);
    const dayName = date.toLocaleDateString("pt-BR", { weekday: "short" });
    const dayNumber = date.getDate();
    const month = date.toLocaleDateString("pt-BR", { month: "short" });

    ctx.fillStyle = "#1F2937";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`${dayName} ${dayNumber}/${month}`, x + barPadding, y + 5);

    ctx.font = "16px Arial";
    ctx.fillText(`${Math.round(day.kcal)}/${Math.round(goalCalories)} kcal`, x + barPadding, y + 25);

    const fillWidth = (barInnerWidth * percentage) / 100;

    ctx.fillStyle = "#E5E7EB";
    ctx.fillRect(x + barPadding, barY, barInnerWidth, barInnerHeight);

    ctx.fillStyle = percentage >= 100 ? "#EF4444" : "#3B82F6";
    ctx.fillRect(x + barPadding, barY, fillWidth, barInnerHeight);

    ctx.fillStyle = percentage >= 50 ? "#FFFFFF" : "#1F2937";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    if (fillWidth > 60) {
      ctx.fillText(
        `${Math.round(percentage)}%`,
        x + barPadding + fillWidth / 2,
        barY + barInnerHeight / 2
      );
    }
  }
}


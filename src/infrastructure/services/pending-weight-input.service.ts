import { logger } from "@shared/logger/logger";

export class PendingWeightInputService {
  private static pendingWeightInputs: Map<string, boolean> = new Map();

  static setPendingWeightInput(userId: string): void {
    this.pendingWeightInputs.set(userId, true);
    logger.debug({ userId }, "Pending weight input set");
  }

  static hasPendingWeightInput(userId: string): boolean {
    return this.pendingWeightInputs.has(userId);
  }

  static clearPendingWeightInput(userId: string): void {
    const existed = this.pendingWeightInputs.delete(userId);
    if (existed) {
      logger.debug({ userId }, "Pending weight input cleared");
    }
  }
}


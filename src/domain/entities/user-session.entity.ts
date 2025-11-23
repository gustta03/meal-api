export type OnboardingStep = "welcome" | "explaining" | "practicing" | "completed";

export class UserSession {
  private constructor(
    public readonly userId: string,
    public readonly onboardingStep: OnboardingStep,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    this.validate();
  }

  static create(userId: string): UserSession {
    const now = new Date();
    return new UserSession(userId, "welcome", now, now);
  }

  static fromPersistence(
    userId: string,
    onboardingStep: OnboardingStep,
    createdAt: Date,
    updatedAt: Date
  ): UserSession {
    return new UserSession(userId, onboardingStep, createdAt, updatedAt);
  }

  updateOnboardingStep(step: OnboardingStep): UserSession {
    return new UserSession(this.userId, step, this.createdAt, new Date());
  }

  completeOnboarding(): UserSession {
    return new UserSession(this.userId, "completed", this.createdAt, new Date());
  }

  private validate(): void {
    if (!this.userId || this.userId.trim().length === 0) {
      throw new Error("User ID is required");
    }
  }
}


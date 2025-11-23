import { ManageOnboardingUseCase } from "@application/use-cases/manage-onboarding.use-case";
import { makeUserSessionRepository } from "../repositories/user-session-repository-factory";
import { makeMealRepository } from "../repositories/meal-repository-factory";

export const makeManageOnboardingUseCase = (): ManageOnboardingUseCase => {
  const userSessionRepository = makeUserSessionRepository();
  const mealRepository = makeMealRepository();
  return new ManageOnboardingUseCase(userSessionRepository, mealRepository);
};


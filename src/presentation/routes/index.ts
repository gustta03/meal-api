import { Elysia } from "elysia";
import { createFoodRoutes } from "./food.routes";

export function registerRoutes(app: Elysia) {
  return app
    .use(createFoodRoutes());
}


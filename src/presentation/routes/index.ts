import { Elysia } from "elysia";
import { createFoodRoutes } from "./food.routes";
import { createPacoRoutes } from "./paco.routes";
import { createHealthRoutes } from "./health.routes";

export function registerRoutes(app: Elysia) {
  return app
    .use(createFoodRoutes())
    .use(createPacoRoutes())
    .use(createHealthRoutes());
}


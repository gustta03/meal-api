import { Elysia, t } from "elysia";
import { AlysiaAdapter } from "../adapters/alysia.adapter";
import { CreateFoodDto } from "@application/dtos/create-food.dto";
import { UpdateFoodDto } from "@application/dtos/update-food.dto";
import { FoodResponseDto } from "@application/dtos/food-response.dto";
import { makeFoodController } from "@infrastructure/factories/controllers/food-controller-factory";

export function createFoodRoutes() {
  const controller = makeFoodController();
  return new Elysia({ prefix: "/foods" })
    .post(
      "/",
      AlysiaAdapter.adaptWithBody<FoodResponseDto, CreateFoodDto>(
        (body) => controller.create(body),
        201
      ),
      {
        body: t.Object({
          name: t.String(),
          calories: t.Number(),
          protein: t.Number(),
          carbs: t.Number(),
          fat: t.Number(),
        }),
      }
    )
    .get(
      "/",
      AlysiaAdapter.adapt(() => controller.list())
    )
    .get(
      "/:id",
      AlysiaAdapter.adaptWithParams(
        (params: { id: string }) => controller.getById(params.id)
      ),
      {
        params: t.Object({
          id: t.String(),
        }),
      }
    )
    .put(
      "/:id",
      AlysiaAdapter.adaptWithParamsAndBody<FoodResponseDto, { id: string }, UpdateFoodDto>(
        (params, body) => controller.update(params.id, body)
      ),
      {
        params: t.Object({
          id: t.String(),
        }),
        body: t.Object({
          name: t.Optional(t.String()),
          calories: t.Optional(t.Number()),
          protein: t.Optional(t.Number()),
          carbs: t.Optional(t.Number()),
          fat: t.Optional(t.Number()),
        }),
      }
    )
    .delete(
      "/:id",
      AlysiaAdapter.adaptVoid(
        (params: { id: string }) => controller.delete(params.id)
      ),
      {
        params: t.Object({
          id: t.String(),
        }),
      }
    );
}


import { Elysia, t } from "elysia";
import { AlysiaAdapter } from "../adapters/alysia.adapter";
import { CreatePacoItemDto } from "@application/dtos/create-paco-item.dto";
import { PacoItemResponseDto } from "@application/dtos/paco-item-response.dto";
import { makePacoController } from "@infrastructure/factories/controllers/paco-controller-factory";

export function createPacoRoutes() {
  const controller = makePacoController();
  return new Elysia({ prefix: "/paco" })
    .post(
      "/",
      AlysiaAdapter.adaptWithBody<PacoItemResponseDto, CreatePacoItemDto>(
        (body) => controller.create(body),
        201
      ),
      {
        body: t.Object({
          name: t.String(),
          energyKcal: t.Number(),
          proteinG: t.Number(),
          carbG: t.Number(),
          fatG: t.Number(),
          standardPortionG: t.Number(),
          unit: t.Union([t.Literal("g"), t.Literal("ml")]),
          alternativeNames: t.Optional(t.Array(t.String())),
        }),
      }
    )
    .get(
      "/",
      AlysiaAdapter.adapt(() => controller.list())
    )
    .get(
      "/search",
      AlysiaAdapter.adaptWithQuery(
        (query: { q: string }) => controller.search(query.q)
      ),
      {
        query: t.Object({
          q: t.String(),
        }),
      }
    );
}


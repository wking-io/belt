import { createRouter } from "remix/fetch-router";
import controller from "./actions/controller.ts";
import primitivesController from "./actions/primitives/controller.ts";
import { routes } from "./routes.ts";

export function createExampleRouter() {
  const router = createRouter();

  router.map(routes.home, controller.actions.home);
  router.map(routes.primitives, primitivesController);

  return router;
}

export const router = createExampleRouter();

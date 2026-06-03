import { assert, it } from "@effect/vitest";
import { toolbarApiRoutes, ToolbarApi } from "../src/index.ts";
import { HttpApi as EffectHttpApi } from "effect/unstable/httpapi";

it("defines the Effect HTTP API from the core protocol model", () => {
  const endpoints: Array<{ method: string; path: string }> = [];

  EffectHttpApi.reflect(ToolbarApi, {
    onGroup: () => {},
    onEndpoint: ({ endpoint }) => {
      endpoints.push({
        method: endpoint.method,
        path: endpoint.path,
      });
    },
  });

  assert.deepStrictEqual(endpoints, [
    {
      method: "GET",
      path: toolbarApiRoutes.root,
    },
    {
      method: "GET",
      path: toolbarApiRoutes.tools,
    },
  ]);
});

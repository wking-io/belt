import { ControlSnapshotStoreLive } from "@repo/control-panel-core";
import type { ToolbarConfigSource } from "@repo/core";
import { Context, Layer } from "effect";
import { HttpRouter, HttpServer } from "effect/unstable/http";
import { createToolbarRouter, type ToolbarServer } from "@repo/server";

export { createToolbarRouter, type ToolbarServer } from "@repo/server";

export function createToolbarServer(config: ToolbarConfigSource): ToolbarServer {
  const app = createToolbarRouter(config).pipe(
    Layer.provideMerge(ControlSnapshotStoreLive),
    Layer.provide(HttpServer.layerServices)
  );

  const { handler, dispose } = HttpRouter.toWebHandler(app);
  const context = Context.makeUnsafe<unknown>(new Map());

  return {
    fetch: (request) => handler(request, context),
    dispose
  };
}

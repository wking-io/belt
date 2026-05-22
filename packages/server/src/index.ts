import {
  toolbarError,
  toolbarSuccess,
  toolbarApiBasePath,
  toolbarApiRelativeRoutes,
  toolbarApiToolRelativePath,
  ToolbarApi,
  ToolbarErrorEnvelopeSchema,
  ToolbarToolIdSchema,
  type ToolbarError,
  type ToolbarResponseEnvelope,
  type ToolbarToolData,
  type ToolbarSuccessEnvelope,
  type ToolbarConfig as ToolbarConfigData
} from "@repo/core";
import { ToolbarConfig } from "@repo/config";
import { Effect, Layer, Schema } from "effect";
import { HttpRouter, HttpServer, HttpServerRequest, HttpServerResponse } from "effect/unstable/http";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { ToolbarProtocolError, ToolbarToolDispatch } from "./tool-dispatch.js";

export type ToolbarServer = {
  readonly fetch: (request: Request) => Promise<Response>;
  readonly dispose: () => Promise<void>;
};

const ToolbarToolIdParamsSchema = Schema.Struct({
  toolId: ToolbarToolIdSchema
});

export function createToolbarServer(config: ToolbarConfigData): ToolbarServer {
  const app = Layer.mergeAll(
    ToolbarApiRoutes,
    ToolDispatchRoutes,
    NotFoundRoutes
  ).pipe(
    Layer.provide(ToolbarToolDispatch.layer),
    Layer.provide(ToolbarConfig.layer(config))
  );

  const { handler, dispose } = HttpRouter.toWebHandler(app.pipe(
    Layer.provide(HttpServer.layerServices)
  ));

  return {
    fetch: handler,
    dispose
  };
}

export function createToolbarRouter(config: ToolbarConfigData) {
  return Layer.mergeAll(
    ToolbarApiRoutes,
    ToolDispatchRoutes,
    NotFoundRoutes
  ).pipe(
    Layer.provide(ToolbarToolDispatch.layer),
    Layer.provide(ToolbarConfig.layer(config))
  );
}

const ToolbarApiHandlers = HttpApiBuilder.group(
  ToolbarApi,
  "toolbar",
  Effect.fn(function*(handlers) {
    const toolDispatch = yield* ToolbarToolDispatch;

    return handlers
      .handle("root", () =>
        Effect.map(toolDispatch.metadata, (tools) =>
          toolbarSuccess({
            apiVersion: 1,
            tools
          })))
      .handle("tools", () =>
        Effect.map(toolDispatch.metadata, (tools) =>
          toolbarSuccess({
            tools
          })));
  })
);

const ToolbarApiRoutes = HttpApiBuilder.layer(ToolbarApi).pipe(
  Layer.provide(ToolbarApiHandlers)
);

const ToolDispatchRoutes = HttpRouter.use(Effect.fn("ToolDispatchRoutes")(function*(router_) {
  const toolDispatch = yield* ToolbarToolDispatch;
  const router = router_.prefixed(toolbarApiBasePath);

  yield* router.add("*", toolbarApiRelativeRoutes.toolRoute, Effect.fn("ToolDispatchRoutes.handle")(function*(request) {
    const { toolId } = yield* HttpRouter.schemaPathParams(ToolbarToolIdParamsSchema);
    const routePath = getToolRoutePath(request.url, toolId);

    if (routePath === undefined) {
      if (request.method !== "GET") {
        return yield* errorResponse({ code: "METHOD_NOT_ALLOWED", message: "Method not allowed" }, 405);
      }

      return yield* respond(Effect.map(toolDispatch.tool(toolId), (tool) => toolbarSuccess({ tool })));
    }

    const webRequest = yield* HttpServerRequest.toWeb(request);
    return yield* respond(Effect.map(toolDispatch.route(toolId, routePath, webRequest), toolbarSuccess));
  }));
}));

const NotFoundRoutes = HttpRouter.use(Effect.fn("NotFoundRoutes")(function*(router) {
  yield* router.add("*", "*", notFoundResponse);
}));

const notFoundResponse = Effect.fn("ToolbarServer.notFoundResponse")(function*() {
  return yield* errorResponse({ code: "NOT_FOUND", message: "Not found" }, 404);
});

const errorResponse = Effect.fn("ToolbarServer.errorResponse")(function*(error: ToolbarError, status: number) {
  return yield* HttpServerResponse.schemaJson(ToolbarErrorEnvelopeSchema)(toolbarError(error), { status });
});

const jsonResponse = Effect.fn("ToolbarServer.jsonResponse")(function*<Data>(body: ToolbarResponseEnvelope<Data>) {
  return yield* HttpServerResponse.json(body);
});

const respond = Effect.fn("ToolbarServer.respond")(function*<Data>(
  effect: Effect.Effect<ToolbarSuccessEnvelope<Data>, ToolbarProtocolError>
) {
  return yield* Effect.matchEffect(effect, {
    onFailure: (error) => errorResponse(error.error, error.status),
    onSuccess: (body) => jsonResponse(body)
  });
});

function getToolRoutePath(url: string, toolId: string): string | undefined {
  const pathname = new URL(url, "http://toolbar.local").pathname;
  const routePrefix = toolbarApiToolRelativePath(toolId);
  const remainder = pathname.slice(routePrefix.length);

  if (!remainder) {
    return undefined;
  }

  const routePath = remainder.replace(/^\/+/, "");

  return routePath || "index";
}

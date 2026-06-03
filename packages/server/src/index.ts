import {
  toolbarError,
  toolbarSuccess,
  toolbarApiBasePath,
  toolbarApiRelativeRoutes,
  toolbarApiToolPath,
  normalizeRoute,
  toToolbarToolMetadata,
  ToolbarApi,
  ToolbarErrorEnvelopeSchema,
  ToolbarToolIdSchema,
  extractToolbarConfig,
  resolveToolbarConfig,
  type ToolbarError,
  type ToolbarResponseEnvelope,
  type ToolDefinition,
  type ToolbarConfigSource,
} from "@repo/core";
import { ToolbarConfig as ToolbarConfigService } from "@repo/config";
import { Effect, Layer, Schema } from "effect";
import { HttpRouter, HttpServerRequest, HttpServerResponse } from "effect/unstable/http";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { toToolbarServer, toToolbarWebHandler, type ToolbarServer } from "./http-handler.js";
import { ToolbarProtocolError, ToolbarToolDispatch } from "./tool-dispatch.js";

export type { ToolbarServer } from "./http-handler.js";

const ToolbarToolIdParamsSchema = Schema.Struct({
  toolId: ToolbarToolIdSchema,
});

export function createToolbarServer(config: ToolbarConfigSource): ToolbarServer {
  return toToolbarServer(createToolbarRouter(config));
}

export function createToolbarRouter(
  config: ToolbarConfigSource,
): Layer.Layer<never, unknown, unknown> {
  const toolbarConfig = resolveToolbarConfig(config);
  const toolbarBackendConfig = extractToolbarConfig(toolbarConfig);
  const toolbarRoutes = toolbarBackendConfig.tools.reduce<Layer.Layer<never, unknown, unknown>>(
    (routes, tool) => Layer.mergeAll(routes, createToolApiRoutes(tool)),
    ToolbarApiRoutes,
  );

  return Layer.mergeAll(toolbarRoutes, ToolMetadataRoutes, NotFoundRoutes).pipe(
    Layer.provide(ToolbarToolDispatch.layer),
    Layer.provide(ToolbarConfigService.layer(toolbarConfig)),
  );
}

const ToolbarApiHandlers = HttpApiBuilder.group(
  ToolbarApi,
  "toolbar",
  Effect.fn(function* (handlers) {
    const toolDispatch = yield* ToolbarToolDispatch;

    return handlers
      .handle("root", () =>
        Effect.map(toolDispatch.metadata, (tools) =>
          toolbarSuccess({
            apiVersion: 1,
            tools,
          }),
        ),
      )
      .handle("tools", () =>
        Effect.map(toolDispatch.metadata, (tools) =>
          toolbarSuccess({
            tools,
          }),
        ),
      );
  }),
);

const ToolbarApiRoutes = HttpApiBuilder.layer(ToolbarApi).pipe(Layer.provide(ToolbarApiHandlers));

const ToolMetadataRoutes = HttpRouter.use(
  Effect.fn("ToolMetadataRoutes")(function* (router_) {
    const toolDispatch = yield* ToolbarToolDispatch;
    const router = router_.prefixed(toolbarApiBasePath);

    yield* router.add(
      "*",
      toolbarApiRelativeRoutes.tool,
      Effect.fn("ToolMetadataRoutes.handle")(function* (request) {
        const { toolId } = yield* HttpRouter.schemaPathParams(ToolbarToolIdParamsSchema);

        if (request.method !== "GET") {
          return yield* errorResponse(
            { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" },
            405,
          );
        }

        return yield* respond(
          Effect.map(toolDispatch.tool(toolId), (tool) => toolbarSuccess({ tool })),
        );
      }),
    );
  }),
);

const NotFoundRoutes = HttpRouter.use(
  Effect.fn("NotFoundRoutes")(function* (router) {
    yield* router.add("*", "*", notFoundResponse);
  }),
);

function createToolApiRoutes<const Tool extends ToolDefinition>(
  tool: Tool,
): Layer.Layer<never, unknown, unknown> {
  if (!tool.api || !tool.apiLayer) {
    return Layer.empty;
  }

  const apiApp = HttpApiBuilder.layer(tool.api).pipe(Layer.provide(tool.apiLayer));
  const app = tool.runtimeLayer ? apiApp.pipe(Layer.provide(tool.runtimeLayer)) : apiApp;
  const { handle, dispose } = toToolbarWebHandler(app);
  const toolPath = toolbarApiToolPath(tool.id);
  const mountedRoute = `${toolPath}/*` as `/${string}`;

  const routes = HttpRouter.use(
    Effect.fn(`ToolApiRoutes.${tool.id}`)(function* (router) {
      yield* router.add(
        "*",
        mountedRoute,
        Effect.fn(`ToolApiRoutes.${tool.id}.handle`)(function* (request) {
          const webRequest = yield* HttpServerRequest.toWeb(request);

          if (new URL(webRequest.url).pathname === toolPath) {
            if (request.method !== "GET") {
              return yield* errorResponse(
                { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" },
                405,
              );
            }

            return yield* jsonResponse(toolbarSuccess({ tool: toToolbarToolMetadata(tool) }));
          }

          const rewrittenRequest = rewriteToolApiRequest(webRequest, toolPath);
          const context = yield* Effect.context<unknown>();
          const response = yield* Effect.promise(() => handle(rewrittenRequest, context));

          return HttpServerResponse.fromWeb(response);
        }),
      );
    }),
  );

  return Layer.mergeAll(
    routes,
    Layer.effectDiscard(Effect.addFinalizer(() => Effect.promise(dispose))),
  );
}

function rewriteToolApiRequest(request: Request, toolPath: string): Request {
  const url = new URL(request.url);
  url.pathname = normalizeRoute(url.pathname.slice(toolPath.length));

  return new Request(url, request);
}

const notFoundResponse = Effect.fn("ToolbarServer.notFoundResponse")(function* () {
  return yield* errorResponse({ code: "NOT_FOUND", message: "Not found" }, 404);
});

const errorResponse = Effect.fn("ToolbarServer.errorResponse")(function* (
  error: ToolbarError,
  status: number,
) {
  return yield* HttpServerResponse.schemaJson(ToolbarErrorEnvelopeSchema)(toolbarError(error), {
    status,
  });
});

const jsonResponse = Effect.fn("ToolbarServer.jsonResponse")(function* <Data>(
  body: ToolbarResponseEnvelope<Data>,
) {
  return yield* HttpServerResponse.json(body);
});

const respond = Effect.fn("ToolbarServer.respond")(function* <Data>(
  effect: Effect.Effect<{ readonly ok: true; readonly data: Data }, ToolbarProtocolError>,
) {
  return yield* Effect.matchEffect(effect, {
    onFailure: (error) => errorResponse(error.error, error.status),
    onSuccess: (body) => jsonResponse(body),
  });
});

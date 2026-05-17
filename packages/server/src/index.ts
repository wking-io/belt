import {
  toolbarError,
  toolbarSuccess,
  toToolbarToolMetadata,
  ToolbarErrorEnvelopeSchema,
  ToolbarRootDataSchema,
  ToolbarSuccessEnvelopeSchema,
  ToolbarToolIdSchema,
  ToolbarToolDataSchema,
  ToolbarToolsDataSchema,
  type ToolbarError,
  type ToolbarResponseEnvelope,
  type ToolDefinition,
  type ToolbarToolData,
  type ToolbarToolsData,
  type ToolbarRootData,
  type ToolbarSuccessEnvelope,
  type ToolbarConfig as ToolbarConfigData
} from "@repo/core";
import { ToolbarConfig } from "@repo/config";
import { Context, Effect, Layer, Schema } from "effect";
import { HttpRouter, HttpServer, HttpServerRequest, HttpServerResponse } from "effect/unstable/http";
import { HttpApi, HttpApiBuilder, HttpApiEndpoint, HttpApiGroup, OpenApi } from "effect/unstable/httpapi";

export type ToolbarServer = {
  readonly fetch: (request: Request) => Promise<Response>;
  readonly dispose: () => Promise<void>;
};

const ToolbarRootResponseSchema = ToolbarSuccessEnvelopeSchema(ToolbarRootDataSchema);
const ToolbarToolsResponseSchema = ToolbarSuccessEnvelopeSchema(ToolbarToolsDataSchema);
const ToolbarToolResponseSchema = ToolbarSuccessEnvelopeSchema(ToolbarToolDataSchema);
const ToolbarToolIdParamsSchema = Schema.Struct({
  toolId: ToolbarToolIdSchema
});

export class ToolbarApiGroup extends HttpApiGroup.make("toolbar", { topLevel: true })
  .add(
    HttpApiEndpoint.get("root", "/__toolbar", {
      success: ToolbarRootResponseSchema
    }),
    HttpApiEndpoint.get("tools", "/__toolbar/tools", {
      success: ToolbarToolsResponseSchema
    })
  )
  .annotateMerge(OpenApi.annotations({
    title: "Toolbar"
  }))
{}

export class ToolbarApi extends HttpApi.make("toolbar-api")
  .add(ToolbarApiGroup)
  .annotateMerge(OpenApi.annotations({
    title: "Belt Toolbar API"
  }))
{}

export class ToolbarRuntime extends Context.Service<ToolbarRuntime, {
  readonly root: Effect.Effect<ToolbarSuccessEnvelope<ToolbarRootData>>;
  readonly tools: Effect.Effect<ToolbarSuccessEnvelope<ToolbarToolsData>>;
  readonly tool: (toolId: string) => Effect.Effect<ToolbarSuccessEnvelope<ToolbarToolData>, ToolbarProtocolError>;
  readonly route: (toolId: string, routePath: string, request: Request) => Effect.Effect<unknown, ToolbarProtocolError>;
}>()("@repo/server/ToolbarRuntime") {
  static readonly layer = Layer.effect(
    ToolbarRuntime,
    Effect.gen(function*() {
      const config = yield* ToolbarConfig;

      return ToolbarRuntime.of({
        root: Effect.succeed(
          toolbarSuccess({
            apiVersion: 1,
            tools: config.tools.map(toToolbarToolMetadata)
          })
        ),
        tools: Effect.succeed(
          toolbarSuccess({
            tools: config.tools.map(toToolbarToolMetadata)
          })
        ),
        tool: Effect.fn("ToolbarRuntime.tool")(function*(toolId) {
          const tool = findTool(config, toolId);

          if (!tool) {
            return yield* new ToolbarProtocolError({
              error: { code: "UNKNOWN_TOOL", message: "Unknown tool" },
              status: 404
            });
          }

          return toolbarSuccess({
            tool: toToolbarToolMetadata(tool)
          });
        }),
        route: Effect.fn("ToolbarRuntime.route")(function*(toolId, routePath, request) {
          const tool = findTool(config, toolId);

          if (!tool) {
            return yield* new ToolbarProtocolError({
              error: { code: "UNKNOWN_TOOL", message: "Unknown tool" },
              status: 404
            });
          }

          const route = tool.routes?.[routePath];

          if (!route) {
            return yield* new ToolbarProtocolError({
              error: { code: "UNKNOWN_TOOL_ROUTE", message: "Unknown tool route" },
              status: 404
            });
          }

          return yield* route(request).pipe(
            Effect.catch(() =>
              Effect.fail(new ToolbarProtocolError({
                error: { code: "TOOL_ERROR", message: "Tool route failed" },
                status: 500
              })))
          );
        })
      });
    })
  );
}

class ToolbarProtocolError extends Schema.TaggedErrorClass<ToolbarProtocolError>()(
  "ToolbarProtocolError",
  {
    error: ToolbarErrorEnvelopeSchema.fields.error,
    status: Schema.Number
  }
) {}

export function createToolbarServer(config: ToolbarConfigData): ToolbarServer {
  const app = Layer.mergeAll(
    ToolbarApiRoutes,
    ToolDispatchRoutes
  ).pipe(
    Layer.provide(ToolbarRuntime.layer),
    Layer.provide(ToolbarConfig.layer(config))
  );

  const { handler, dispose } = HttpRouter.toWebHandler(app.pipe(
    Layer.provide(HttpServer.layerServices)
  ));

  return {
    fetch: async (request) => {
      const response = await handler(request, Context.empty() as Context.Context<unknown>);

      if (response.status === 404 && !isJsonResponse(response)) {
        return HttpServerResponse.toWeb(await Effect.runPromise(notFoundResponse()));
      }

      return response;
    },
    dispose
  };
}

export function createToolbarRouter(config: ToolbarConfigData) {
  return Layer.mergeAll(
    ToolbarApiRoutes,
    ToolDispatchRoutes
  ).pipe(
    Layer.provide(ToolbarRuntime.layer),
    Layer.provide(ToolbarConfig.layer(config))
  );
}

const ToolbarApiHandlers = HttpApiBuilder.group(
  ToolbarApi,
  "toolbar",
  Effect.fn(function*(handlers) {
    const toolbar = yield* ToolbarRuntime;

    return handlers
      .handle("root", () => toolbar.root)
      .handle("tools", () => toolbar.tools);
  })
);

const ToolbarApiRoutes = HttpApiBuilder.layer(ToolbarApi).pipe(
  Layer.provide(ToolbarApiHandlers)
);

const ToolDispatchRoutes = HttpRouter.use(Effect.fn("ToolDispatchRoutes")(function*(router_) {
  const toolbar = yield* ToolbarRuntime;
  const router = router_.prefixed("/__toolbar");

  yield* router.add("GET", "/tools/:toolId/*", Effect.fn("ToolDispatchRoutes.handle")(function*(request) {
    const { toolId } = yield* HttpRouter.schemaPathParams(ToolbarToolIdParamsSchema);
    const routePath = getToolRoutePath(request.url, toolId);

    if (routePath === undefined) {
      return yield* respond(toolbar.tool(toolId));
    }

    const webRequest = yield* HttpServerRequest.toWeb(request);
    return yield* respond(Effect.map(toolbar.route(toolId, routePath, webRequest), toolbarSuccess));
  }));
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

function findTool(config: ToolbarConfigData, toolId: string): ToolDefinition | undefined {
  return config.tools.find((candidate) => candidate.id === toolId);
}

function getToolRoutePath(url: string, toolId: string): string | undefined {
  const pathname = new URL(url, "http://toolbar.local").pathname;
  const routePrefix = `/tools/${toolId}`;
  const remainder = pathname.slice(routePrefix.length);

  if (!remainder) {
    return undefined;
  }

  const routePath = remainder.replace(/^\/+/, "");

  return routePath || "index";
}

function isJsonResponse(response: Response): boolean {
  return response.headers.get("content-type")?.includes("application/json") ?? false;
}

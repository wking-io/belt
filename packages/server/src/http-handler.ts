import { Context, Layer } from "effect";
import { HttpRouter, HttpServer } from "effect/unstable/http";

export type ToolbarServer = {
  readonly fetch: (request: Request) => Promise<Response>;
  readonly dispose: () => Promise<void>;
};

export type ToolbarWebHandler = {
  readonly handle: (request: Request, context: Context.Context<unknown>) => Promise<Response>;
  readonly dispose: () => Promise<void>;
};

type ToolbarWebHandlerRequirements =
  | Layer.Success<typeof HttpServer.layerServices>
  | HttpRouter.HttpRouter
  | HttpRouter.Request<"Requires", unknown>
  | HttpRouter.Request<"GlobalRequires", unknown>
  | HttpRouter.Request<"Error", unknown>
  | HttpRouter.Request<"GlobalError", unknown>;

export function toToolbarServer(router: Layer.Layer<never, unknown, unknown>): ToolbarServer {
  const { handle, dispose } = toToolbarWebHandler(router);
  const context = Context.makeUnsafe<unknown>(new Map());

  return {
    fetch: (request) => handle(request, context),
    dispose,
  };
}

export function toToolbarWebHandler(app: Layer.Layer<never, unknown, unknown>): ToolbarWebHandler {
  // Effect HTTP tracks router and request requirements in internal phantom types that
  // are not preserved once Tools are loaded from runtime Toolbar Config. Keep that
  // type erasure at this assembly seam, immediately before creating the Fetch handler.
  const webHandlerLayer = app.pipe(Layer.provide(HttpServer.layerServices)) as Layer.Layer<
    never,
    unknown,
    Exclude<ToolbarWebHandlerRequirements, Layer.Success<typeof HttpServer.layerServices>>
  >;
  const { handler, dispose } = HttpRouter.toWebHandler(webHandlerLayer);

  return {
    handle: handler,
    dispose,
  };
}

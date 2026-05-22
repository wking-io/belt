import type { ToolbarConfigSource } from "@repo/core";
import { createToolbarServer, type ToolbarServer } from "./server.js";

export type { RemixToolbarRouteArgs } from "@repo/adapter-remix";
export * from "@repo/renderer-remix";
export * from "@repo/control-panel-core";

export type RemixToolbarRouteHandler = {
  (args: { readonly request: Request }): Promise<Response>;
  readonly server: ToolbarServer;
  readonly dispose: () => Promise<void>;
};

/**
 * Creates a Remix loader/action-shaped Toolbar API handler using Belt's
 * standard live tool dependencies.
 */
export function createToolbarRouteHandler(config: ToolbarConfigSource): RemixToolbarRouteHandler {
  const server = createToolbarServer(config);
  const route = (args: { readonly request: Request }) => server.fetch(args.request);

  return Object.assign(route, {
    server,
    dispose: () => server.dispose()
  });
}

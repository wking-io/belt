import type { ToolbarConfigSource } from "@repo/core";
import { createToolbarServer, type ToolbarServer } from "@repo/server";

export type RemixToolbarRouteArgs = {
  readonly request: Request;
};

export type RemixToolbarRouteHandler = {
  (args: RemixToolbarRouteArgs): Promise<Response>;
  readonly server: ToolbarServer;
  readonly dispose: () => Promise<void>;
};

/**
 * Creates a Remix loader/action-shaped Toolbar API handler for explicit route mounting.
 *
 * Use this when you want to export the same function from a Remix loader and action.
 */
export function createToolbarRouteHandler(config: ToolbarConfigSource): RemixToolbarRouteHandler {
  const server = createToolbarServer(config);
  const route = (args: RemixToolbarRouteArgs) => server.fetch(args.request);

  return Object.assign(route, {
    server,
    dispose: () => server.dispose()
  });
}

import { createToolbarFetchHandler, type ToolbarFetchHandler } from "@repo/adapter-fetch";
import type { ToolbarConfig } from "@repo/core";

export type RemixToolbarRouteArgs = {
  readonly request: Request;
};

export type RemixToolbarRouteHandler = {
  (args: RemixToolbarRouteArgs): Promise<Response>;
  readonly fetch: ToolbarFetchHandler;
  readonly dispose: () => Promise<void>;
};

/**
 * Creates a Remix loader/action-shaped Toolbar API handler for explicit route mounting.
 *
 * Use this when you want to export the same function from a Remix loader and action.
 */
export function createToolbarRouteHandler(config: ToolbarConfig): RemixToolbarRouteHandler {
  const fetch = createToolbarFetchHandler(config);
  const route = (args: RemixToolbarRouteArgs) => fetch(args.request);

  return Object.assign(route, {
    fetch,
    dispose: () => fetch.dispose()
  });
}

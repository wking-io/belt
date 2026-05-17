import type { ToolbarConfig } from "@repo/core";
import { createToolbarServer } from "@repo/server";

export type ToolbarFetchHandler = {
  (request: Request): Promise<Response>;
  readonly dispose: () => Promise<void>;
};

export function createToolbarFetchHandler(config: ToolbarConfig): ToolbarFetchHandler {
  const server = createToolbarServer(config);
  const fetch = (request: Request) => server.fetch(request);

  return Object.assign(fetch, {
    dispose: () => server.dispose()
  });
}

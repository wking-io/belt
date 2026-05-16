import type { ToolbarConfig } from "@repo/core";
import { createToolbarServer } from "@repo/server";

export function createToolbarFetchHandler(config: ToolbarConfig) {
  const server = createToolbarServer(config);

  return (request: Request) => server.fetch(request);
}

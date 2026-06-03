import type { ToolbarConfigSource } from "@repo/core";
import {
  createToolbarServer as createToolbarServerWithToolRuntime,
  type ToolbarServer,
} from "@repo/server";

export { createToolbarRouter, type ToolbarServer } from "@repo/server";

export function createToolbarServer(config: ToolbarConfigSource): ToolbarServer {
  return createToolbarServerWithToolRuntime(config);
}

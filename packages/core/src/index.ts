export type ToolRouteHandler = (request: Request) => Promise<Response> | Response;

export * from "./effect.js";

export type ToolbarTool = {
  id: string;
  label: string;
  routes?: Record<string, ToolRouteHandler>;
};

export type ToolbarConfig = {
  tools: ToolbarTool[];
};

export function defineToolbar(config: ToolbarConfig): ToolbarConfig {
  const ids = new Set<string>();

  for (const tool of config.tools) {
    if (ids.has(tool.id)) {
      throw new Error(`Duplicate toolbar tool id: ${tool.id}`);
    }

    ids.add(tool.id);
  }

  return config;
}

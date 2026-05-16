import type { ToolbarConfig } from "@repo/core";

export type ToolbarRendererModel = {
  tools: Array<{
    id: string;
    label: string;
  }>;
};

export function createToolbarRendererModel(config: ToolbarConfig): ToolbarRendererModel {
  return {
    tools: config.tools.map((tool) => ({
      id: tool.id,
      label: tool.label
    }))
  };
}

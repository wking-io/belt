import {
  defineToolbarDefinition,
  extractToolbarConfig,
  type ToolbarConfig,
  type ToolbarConfigSource,
  type ToolbarDefinition
} from "@repo/core";

export type ToolbarRendererModel = {
  tools: Array<{
    id: string;
    label: string;
  }>;
};

export type ToolbarRendererDefinition = ToolbarDefinition & {
  readonly renderer: ToolbarRendererModel;
};

export function createToolbar(config: ToolbarConfig): ToolbarRendererDefinition {
  const definition = defineToolbarDefinition({ toolbarConfig: config });

  return {
    ...definition,
    renderer: createToolbarRendererModel(definition)
  };
}

export function createToolbarRendererModel(config: ToolbarConfigSource): ToolbarRendererModel {
  const toolbarConfig = extractToolbarConfig(config);

  return {
    tools: toolbarConfig.tools.map((tool) => ({
      id: tool.id,
      label: tool.label
    }))
  };
}

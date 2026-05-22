import { defineTool } from "@repo/core";
import {
  controlPanelToolId,
  controlPanelToolLabel,
  defineControlPanel,
  type ControlPanelConfig,
  type ControlPanelRegistration
} from "../config/index.js";
import { ControlPanelToolApi } from "./api.js";
import { controlPanelToolApiLayer } from "./handlers.js";

export * from "./api.js";
export * from "./handlers.js";

export function controlPanelTool<const Config extends ControlPanelConfig>(
  config: Config
): ControlPanelRegistration<Config["fieldsets"]> {
  const definition = defineControlPanel(config);

  return {
    config: definition,
    tool: defineTool({
      api: ControlPanelToolApi,
      apiLayer: controlPanelToolApiLayer(definition),
      id: controlPanelToolId,
      label: controlPanelToolLabel
    })
  };
}

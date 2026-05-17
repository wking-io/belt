import { createToolbarRouteHandler } from "@repo/adapter-remix";
import toolbarConfig from "../toolbar.config.ts";

export const toolbarRouteHandler = createToolbarRouteHandler(toolbarConfig);

import { createToolbarRouteHandler } from "@riff-refine/belt/remix";
import toolbarConfig from "../toolbar.config.ts";

export const toolbarRouteHandler = createToolbarRouteHandler(toolbarConfig);

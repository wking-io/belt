import { createToolbarFetchHandler } from "@repo/adapter-remix";
import toolbarConfig from "../toolbar.config.ts";

export const toolbarFetchHandler = createToolbarFetchHandler(toolbarConfig);

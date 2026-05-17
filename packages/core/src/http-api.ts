import { HttpApi, HttpApiEndpoint, HttpApiGroup, OpenApi } from "effect/unstable/httpapi";
import {
  toolbarApiRoutes,
  ToolbarRootDataSchema,
  ToolbarSuccessEnvelopeSchema,
  ToolbarToolsDataSchema
} from "./protocol.js";

export const ToolbarRootResponseSchema = ToolbarSuccessEnvelopeSchema(ToolbarRootDataSchema);
export const ToolbarToolsResponseSchema = ToolbarSuccessEnvelopeSchema(ToolbarToolsDataSchema);

export class ToolbarApiGroup extends HttpApiGroup.make("toolbar", { topLevel: true })
  .add(
    HttpApiEndpoint.get("root", toolbarApiRoutes.root, {
      success: ToolbarRootResponseSchema
    }),
    HttpApiEndpoint.get("tools", toolbarApiRoutes.tools, {
      success: ToolbarToolsResponseSchema
    })
  )
  .annotateMerge(OpenApi.annotations({
    title: "Toolbar"
  }))
{}

export class ToolbarApi extends HttpApi.make("toolbar-api")
  .add(ToolbarApiGroup)
  .annotateMerge(OpenApi.annotations({
    title: "Belt Toolbar API"
  }))
{}

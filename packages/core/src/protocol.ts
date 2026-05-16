import { Schema } from "effect";

export const toolbarApiBasePath = "/__toolbar";

export const toolbarApiRoutes = {
  root: "/__toolbar",
  tools: "/__toolbar/tools",
  tool: "/__toolbar/tools/:toolId",
  toolRoute: "/__toolbar/tools/:toolId/*routePath"
} as const;

export const ToolbarToolIdSchema = Schema.String;
export const ToolbarToolLabelSchema = Schema.String;
export const ToolbarToolRoutePathSchema = Schema.String;

export const ToolbarErrorCodeSchema = Schema.Literals([
  "INVALID_REQUEST",
  "NOT_FOUND",
  "METHOD_NOT_ALLOWED",
  "UNKNOWN_TOOL",
  "UNKNOWN_TOOL_ROUTE",
  "TOOL_ERROR",
  "INTERNAL_ERROR"
]);

export type ToolbarErrorCode = Schema.Schema.Type<typeof ToolbarErrorCodeSchema>;

export const ToolbarErrorSchema = Schema.Struct({
  code: ToolbarErrorCodeSchema,
  message: Schema.String,
  details: Schema.optionalKey(Schema.Unknown)
});

export type ToolbarError = Schema.Schema.Type<typeof ToolbarErrorSchema>;

export const ToolbarToolMetadataSchema = Schema.Struct({
  id: ToolbarToolIdSchema,
  label: ToolbarToolLabelSchema,
  routes: Schema.Array(ToolbarToolRoutePathSchema)
});

export type ToolbarToolMetadata = Schema.Schema.Type<typeof ToolbarToolMetadataSchema>;

export const ToolbarRootDataSchema = Schema.Struct({
  apiVersion: Schema.Literal(1),
  tools: Schema.Array(ToolbarToolMetadataSchema)
});

export type ToolbarRootData = Schema.Schema.Type<typeof ToolbarRootDataSchema>;

export const ToolbarToolsDataSchema = Schema.Struct({
  tools: Schema.Array(ToolbarToolMetadataSchema)
});

export type ToolbarToolsData = Schema.Schema.Type<typeof ToolbarToolsDataSchema>;

export const ToolbarToolDataSchema = Schema.Struct({
  tool: ToolbarToolMetadataSchema
});

export type ToolbarToolData = Schema.Schema.Type<typeof ToolbarToolDataSchema>;

export const ToolbarSuccessEnvelopeSchema = <Data extends Schema.Schema<unknown>>(data: Data) =>
  Schema.Struct({
    ok: Schema.Literal(true),
    data
  });

export const ToolbarErrorEnvelopeSchema = Schema.Struct({
  ok: Schema.Literal(false),
  error: ToolbarErrorSchema
});

export type ToolbarErrorEnvelope = Schema.Schema.Type<typeof ToolbarErrorEnvelopeSchema>;

export type ToolbarSuccessEnvelope<Data> = {
  readonly ok: true;
  readonly data: Data;
};

export type ToolbarResponseEnvelope<Data> = ToolbarSuccessEnvelope<Data> | ToolbarErrorEnvelope;

export function toolbarSuccess<Data>(data: Data): ToolbarSuccessEnvelope<Data> {
  return {
    ok: true,
    data
  };
}

export function toolbarError(error: ToolbarError): ToolbarErrorEnvelope {
  return {
    ok: false,
    error
  };
}

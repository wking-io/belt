import { Schema } from "effect";
import { HttpApi } from "effect/unstable/httpapi";

export const toolbarApiBasePath = "/__toolbar";

export type ToolbarApiRoutes = {
  readonly root: "/__toolbar";
  readonly tools: "/__toolbar/tools";
  readonly tool: "/__toolbar/tools/:toolId";
  readonly toolRoute: "/__toolbar/tools/:toolId/*routePath";
};

export const toolbarApiRoutes: ToolbarApiRoutes = {
  root: "/__toolbar",
  tools: "/__toolbar/tools",
  tool: "/__toolbar/tools/:toolId",
  toolRoute: "/__toolbar/tools/:toolId/*routePath",
};

export type ToolbarApiRelativeRoutes = {
  readonly tool: "/tools/:toolId";
  readonly toolRoute: "/tools/:toolId/*";
};

export const toolbarApiRelativeRoutes: ToolbarApiRelativeRoutes = {
  tool: "/tools/:toolId",
  toolRoute: "/tools/:toolId/*",
};

export function toolbarApiToolPath(toolId: string): string {
  return `${toolbarApiBasePath}${toolbarApiToolRelativePath(toolId)}`;
}

export function toolbarApiToolRoutePath(toolId: string, routePath?: string): string {
  const toolPath = toolbarApiToolPath(toolId);

  if (!routePath) {
    return toolPath;
  }

  return `${toolPath}/${routePath.replace(/^\/+/, "")}`;
}

export function normalizeToolRoutePath(routePath: string): string {
  const normalized = routePath.trim().replace(/^\/+/, "").replace(/\/+$/, "");

  if (!normalized || normalized === ".") {
    return "index";
  }

  if (
    normalized === toolbarApiBasePath.replace(/^\/+/, "") ||
    normalized.startsWith(`${toolbarApiBasePath.replace(/^\/+/, "")}/`)
  ) {
    throw new Error("Tool route paths must be relative to the tool");
  }

  if (normalized === "tools" || normalized.startsWith("tools/")) {
    throw new Error("Tool route paths must not include the Toolbar tools mount");
  }

  return normalized;
}

export function normalizeRoute(routePath: string): `/${string}` {
  const normalized = normalizeToolRoutePath(routePath);

  if (normalized === "index") {
    return "/";
  }

  return `/${normalized}` as `/${string}`;
}

export function toolApiRoutePath(toolId: string, routePath: string): string {
  const normalized = normalizeToolRoutePath(routePath);

  if (normalized === "index") {
    return `${toolbarApiToolPath(toolId)}/`;
  }

  return toolbarApiToolRoutePath(toolId, normalized);
}

export function toToolbarToolApiRoutePaths(
  api: HttpApi.AnyWithProps | undefined,
): readonly string[] {
  if (!api) {
    return [];
  }

  const routePaths: string[] = [];

  HttpApi.reflect(api, {
    onGroup: () => {},
    onEndpoint: ({ endpoint }) => {
      routePaths.push(normalizeToolRoutePath(endpoint.path));
    },
  });

  return routePaths;
}

export function toolbarApiToolRelativePath(toolId: string): string {
  return `/tools/${encodeURIComponent(toolId)}`;
}

export const ToolbarToolIdSchema = Schema.String;
export const ToolbarToolLabelSchema = Schema.String;
export const ToolbarToolRoutePathSchema = Schema.String;

export const ToolbarErrorCodeSchema = Schema.Literals([
  "INVALID_REQUEST",
  "NOT_FOUND",
  "METHOD_NOT_ALLOWED",
  "UNKNOWN_TOOL",
  "INTERNAL_ERROR",
]);

export type ToolbarErrorCode = Schema.Schema.Type<typeof ToolbarErrorCodeSchema>;

export const ToolbarErrorSchema = Schema.Struct({
  code: ToolbarErrorCodeSchema,
  message: Schema.String,
  details: Schema.optionalKey(Schema.Unknown),
});

export type ToolbarError = Schema.Schema.Type<typeof ToolbarErrorSchema>;

export const ToolbarToolMetadataSchema = Schema.Struct({
  id: ToolbarToolIdSchema,
  label: ToolbarToolLabelSchema,
  routes: Schema.Array(ToolbarToolRoutePathSchema),
});

export type ToolbarToolMetadata = Schema.Schema.Type<typeof ToolbarToolMetadataSchema>;

export const ToolbarRootDataSchema = Schema.Struct({
  apiVersion: Schema.Literal(1),
  tools: Schema.Array(ToolbarToolMetadataSchema),
});

export type ToolbarRootData = Schema.Schema.Type<typeof ToolbarRootDataSchema>;

export const ToolbarToolsDataSchema = Schema.Struct({
  tools: Schema.Array(ToolbarToolMetadataSchema),
});

export type ToolbarToolsData = Schema.Schema.Type<typeof ToolbarToolsDataSchema>;

export const ToolbarToolDataSchema = Schema.Struct({
  tool: ToolbarToolMetadataSchema,
});

export type ToolbarToolData = Schema.Schema.Type<typeof ToolbarToolDataSchema>;

export const ToolbarSuccessEnvelopeSchema = <Data extends Schema.Schema<unknown>>(data: Data) =>
  Schema.Struct({
    ok: Schema.Literal(true),
    data,
  });

export const ToolbarErrorEnvelopeSchema = Schema.Struct({
  ok: Schema.Literal(false),
  error: ToolbarErrorSchema,
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
    data,
  };
}

export function toolbarError(error: ToolbarError): ToolbarErrorEnvelope {
  return {
    ok: false,
    error,
  };
}

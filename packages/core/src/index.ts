import { Effect, Layer, Schema } from "effect";
import type { SchemaError } from "effect/Schema";
import { HttpApi, HttpApiClient } from "effect/unstable/httpapi";
import { ToolbarApi } from "./http-api.js";
import { NonEmptyStringSchema } from "./schemas.js";
import { toToolbarToolApiRoutePaths, toolbarApiBasePath } from "./protocol.js";

export * from "./effect.js";
export * from "./http-api.js";
export * from "./protocol.js";
export * from "./schemas.js";

export class DuplicateToolbarToolIdError extends Schema.TaggedErrorClass<DuplicateToolbarToolIdError>()(
  "DuplicateToolbarToolIdError",
  {
    id: Schema.String
  }
) {}

export class InvalidToolbarThemeVariableNameError extends Schema.TaggedErrorClass<InvalidToolbarThemeVariableNameError>()(
  "InvalidToolbarThemeVariableNameError",
  {
    name: Schema.String
  }
) {}

export type ToolbarRegistrationError = DuplicateToolbarToolIdError | InvalidToolbarThemeVariableNameError | SchemaError;

export type ToolHttpApi = HttpApi.AnyWithProps;
export type ToolHttpApiLayer = Layer.Layer<any, unknown, any>;

const BeltCssVariableNameSchema = Schema.declare<string>(
  (value): value is string => typeof value === "string" && value.startsWith("--belt-")
);
const BeltCssVariableValueSchema = NonEmptyStringSchema;
const BeltThemeModeSchema = Schema.Literals(["light", "dark"]);
const ThemeDefaultSchema = NonEmptyStringSchema;

export const ToolHttpApiSchema = Schema.declare<ToolHttpApi>(
  (value): value is ToolHttpApi => HttpApi.isHttpApi(value)
);
export const ToolHttpApiLayerSchema = Schema.declare<ToolHttpApiLayer>(
  (value): value is ToolHttpApiLayer => Layer.isLayer(value)
);

export const ThemeVariablesSchema = Schema.Record(BeltCssVariableNameSchema, BeltCssVariableValueSchema);

export const ToolbarThemeSchema = Schema.Struct({
  id: NonEmptyStringSchema,
  name: NonEmptyStringSchema,
  mode: BeltThemeModeSchema,
  extends: Schema.optionalKey(NonEmptyStringSchema),
  variables: ThemeVariablesSchema
});

export type ToolbarTheme = Schema.Schema.Type<typeof ToolbarThemeSchema>;

export const ToolbarThemeConfigSchema = Schema.Union([
  ThemeDefaultSchema,
  Schema.Struct({
    default: Schema.optionalKey(ThemeDefaultSchema),
    themes: Schema.optionalKey(Schema.Array(ToolbarThemeSchema))
  })
]);

export type ToolbarThemeConfig = Schema.Schema.Type<typeof ToolbarThemeConfigSchema>;

export const toolbarBuiltInThemeIds = ["belt-light", "belt-dark"] as const;
export const toolbarSystemThemeId = "system";
export type ToolbarBuiltInThemeId = (typeof toolbarBuiltInThemeIds)[number];

export const ToolbarToolSchema = Schema.Struct({
  id: NonEmptyStringSchema,
  label: NonEmptyStringSchema
});

export type ToolbarTool = Schema.Schema.Type<typeof ToolbarToolSchema>;

export const ToolDefinitionSchema = Schema.Struct({
  ...ToolbarToolSchema.fields,
  api: Schema.optionalKey(ToolHttpApiSchema),
  apiLayer: Schema.optionalKey(ToolHttpApiLayerSchema)
});

export type ToolDefinition = ToolbarTool & {
  readonly api?: ToolHttpApi;
  readonly apiLayer?: ToolHttpApiLayer;
};

export type ToolbarConfig = {
  readonly theme?: ToolbarThemeConfig;
  readonly tools: readonly ToolDefinition[];
};

export const validateToolbarConfig = Effect.fn("validateToolbarConfig")(function*(config: ToolbarConfig) {
  const theme = config.theme === undefined
    ? undefined
    : yield* Schema.decodeUnknownEffect(ToolbarThemeConfigSchema)(config.theme);
  const tools = yield* Schema.decodeUnknownEffect(Schema.Array(ToolDefinitionSchema))(config.tools);

  const duplicateId = findDuplicateToolId(tools);

  if (duplicateId) {
    return yield* new DuplicateToolbarToolIdError({ id: duplicateId });
  }

  const invalidThemeVariableName = theme === undefined ? undefined : findInvalidThemeVariableName(theme);

  if (invalidThemeVariableName) {
    return yield* new InvalidToolbarThemeVariableNameError({ name: invalidThemeVariableName });
  }

  if (theme === undefined) {
    return { tools };
  }

  return { theme, tools };
});

export function defineTool(tool: ToolDefinition): ToolDefinition {
  return Schema.decodeUnknownSync(ToolDefinitionSchema)(tool);
}

export function defineToolbar(config: ToolbarConfig): ToolbarConfig {
  const theme = config.theme === undefined
    ? undefined
    : Schema.decodeUnknownSync(ToolbarThemeConfigSchema)(config.theme);
  const tools = Schema.decodeUnknownSync(Schema.Array(ToolDefinitionSchema))(config.tools);

  const duplicateId = findDuplicateToolId(tools);

  if (duplicateId) {
    throw new DuplicateToolbarToolIdError({ id: duplicateId });
  }

  assertThemeVariableNames(theme);

  if (theme === undefined) {
    return { tools };
  }

  return { theme, tools };
}

export function defineTheme(theme: ToolbarTheme): ToolbarTheme {
  const decoded = Schema.decodeUnknownSync(ToolbarThemeSchema)(theme);

  assertThemeVariableNames({
    themes: [decoded]
  });

  return decoded;
}

export function toToolbarToolMetadata(tool: ToolDefinition) {
  return {
    id: tool.id,
    label: tool.label,
    routes: toToolbarToolApiRoutePaths(tool.api).toSorted()
  };
}

export function makeToolbarClient(options?: {
  readonly baseUrl?: string | URL;
}) {
  return Effect.gen(function*() {
    const baseUrl = options?.baseUrl ?? toolbarApiBasePath;
    const client = yield* HttpApiClient.make(ToolbarApi, { baseUrl });

    return {
      ...client,
      tool: <Api extends ToolHttpApi>(
        api: Api,
        toolId: string
      ) => HttpApiClient.make(api, {
        baseUrl: toolApiBaseUrl(baseUrl, toolId)
      })
    };
  });
}

function toolApiBaseUrl(baseUrl: string | URL, toolId: string): string | URL {
  const toolPath = `tools/${encodeURIComponent(toolId)}/`;

  if (baseUrl instanceof URL) {
    const next = new URL(baseUrl.href);
    next.pathname = `${next.pathname.replace(/\/+$/, "")}/${toolPath}`;
    return next;
  }

  return `${baseUrl.replace(/\/+$/, "")}/${toolPath}`;
}

function findDuplicateToolId(tools: readonly ToolDefinition[]): string | undefined {
  const ids = new Set<string>();

  for (const tool of tools) {
    if (ids.has(tool.id)) {
      return tool.id;
    }

    ids.add(tool.id);
  }

  return undefined;
}

function assertThemeVariableNames(theme: ToolbarThemeConfig | undefined) {
  const invalidThemeVariableName = theme === undefined ? undefined : findInvalidThemeVariableName(theme);

  if (invalidThemeVariableName) {
    throw new InvalidToolbarThemeVariableNameError({ name: invalidThemeVariableName });
  }
}

function findInvalidThemeVariableName(theme: ToolbarThemeConfig): string | undefined {
  if (typeof theme === "string") return undefined;

  for (const registeredTheme of theme.themes ?? []) {
    for (const variableName of Object.keys(registeredTheme.variables)) {
      if (!variableName.startsWith("--belt-")) {
        return variableName;
      }
    }
  }

  return undefined;
}

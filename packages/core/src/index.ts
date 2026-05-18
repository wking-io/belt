import { Effect, Schema } from "effect";
import type { SchemaError } from "effect/Schema";

export * from "./effect.js";
export * from "./http-api.js";
export * from "./protocol.js";

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

export type ToolRouteHandler<Success = unknown, Failure = unknown, Requirements = never> = (
  request: Request
) => Effect.Effect<Success, Failure, Requirements>;

export type ToolbarToolRoutes<Requirements = never> = Readonly<Record<string, ToolRouteHandler<unknown, unknown, Requirements>>>;

const NonEmptyStringSchema = Schema.String.check(Schema.isMinLength(1));
const BeltCssVariableNameSchema = Schema.declare<string>(
  (value): value is string => typeof value === "string" && value.startsWith("--belt-")
);
const BeltCssVariableValueSchema = NonEmptyStringSchema;
const BeltThemeModeSchema = Schema.Literals(["light", "dark"]);
const ThemeDefaultSchema = NonEmptyStringSchema;

export const ToolRouteHandlerSchema = Schema.declare<ToolRouteHandler<unknown, unknown, never>>(
  (value): value is ToolRouteHandler<unknown, unknown, never> => typeof value === "function"
);

export const ToolbarToolRoutesSchema = Schema.Record(Schema.String, ToolRouteHandlerSchema);

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
  routes: Schema.optionalKey(ToolbarToolRoutesSchema)
});

export type ToolDefinition<Requirements = never> = ToolbarTool & {
  readonly routes?: ToolbarToolRoutes<Requirements>;
};

export type ToolbarConfig<Requirements = never> = {
  readonly theme?: ToolbarThemeConfig;
  readonly tools: readonly ToolDefinition<Requirements>[];
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
    routes: Object.keys(tool.routes ?? {}).sort()
  };
}

function findDuplicateToolId(tools: readonly ToolDefinition<any>[]): string | undefined {
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

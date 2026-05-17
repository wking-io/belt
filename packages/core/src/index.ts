import { Effect, Schema } from "effect";
import type { SchemaError } from "effect/Schema";

export * from "./effect.js";
export * from "./protocol.js";

export class DuplicateToolbarToolIdError extends Schema.TaggedErrorClass<DuplicateToolbarToolIdError>()(
  "DuplicateToolbarToolIdError",
  {
    id: Schema.String
  }
) {}

export type ToolbarRegistrationError = DuplicateToolbarToolIdError | SchemaError;

export type ToolRouteHandler<Success = unknown, Failure = unknown, Requirements = never> = (
  request: Request
) => Effect.Effect<Success, Failure, Requirements>;

export type ToolbarToolRoutes<Requirements = never> = Readonly<Record<string, ToolRouteHandler<unknown, unknown, Requirements>>>;

const NonEmptyStringSchema = Schema.String.check(Schema.isMinLength(1));

export const ToolRouteHandlerSchema = Schema.declare<ToolRouteHandler<unknown, unknown, never>>(
  (value): value is ToolRouteHandler<unknown, unknown, never> => typeof value === "function"
);

export const ToolbarToolRoutesSchema = Schema.Record(Schema.String, ToolRouteHandlerSchema);

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
  readonly tools: readonly ToolDefinition<Requirements>[];
};

export const validateToolbarConfig = Effect.fn("validateToolbarConfig")(function*(config: ToolbarConfig) {
  const tools = yield* Schema.decodeUnknownEffect(Schema.Array(ToolDefinitionSchema))(config.tools);

  const duplicateId = findDuplicateToolId(tools);

  if (duplicateId) {
    return yield* new DuplicateToolbarToolIdError({ id: duplicateId });
  }

  return { tools };
});

export function defineTool(tool: ToolDefinition): ToolDefinition {
  return Schema.decodeUnknownSync(ToolDefinitionSchema)(tool);
}

export function defineToolbar(config: ToolbarConfig): ToolbarConfig {
  const tools = Schema.decodeUnknownSync(Schema.Array(ToolDefinitionSchema))(config.tools);

  const duplicateId = findDuplicateToolId(tools);

  if (duplicateId) {
    throw new DuplicateToolbarToolIdError({ id: duplicateId });
  }

  return { tools };
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

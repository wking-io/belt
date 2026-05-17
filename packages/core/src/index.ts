import { Effect, Schema } from "effect";

export * from "./effect.js";
export * from "./protocol.js";

export class DuplicateToolbarToolIdError extends Schema.TaggedErrorClass<DuplicateToolbarToolIdError>()(
  "DuplicateToolbarToolIdError",
  {
    id: Schema.String
  }
) {}

export type ToolbarRegistrationError = DuplicateToolbarToolIdError;

export type ToolRouteHandler<Success = unknown, Failure = unknown, Requirements = never> = (
  request: Request
) => Effect.Effect<Success, Failure, Requirements>;

export type ToolbarToolRoutes<Requirements = never> = Readonly<Record<string, ToolRouteHandler<unknown, unknown, Requirements>>>;

export type ToolbarTool<Requirements = never> = {
  readonly id: string;
  readonly label: string;
  readonly routes?: ToolbarToolRoutes<Requirements>;
};

export type ToolbarToolRequirements<Tool> = Tool extends ToolbarTool<infer Requirements> ? Requirements : never;

export type ToolbarConfig<Requirements = never> = {
  readonly tools: readonly ToolbarTool<Requirements>[];
};

export const validateToolbarConfig = Effect.fn("validateToolbarConfig")(function*<Requirements>(
  config: ToolbarConfig<Requirements>
) {
  const duplicateId = findDuplicateToolId(config.tools);

  if (duplicateId) {
    return yield* new DuplicateToolbarToolIdError({ id: duplicateId });
  }

  return config;
});

export function defineToolbar<const Tools extends readonly ToolbarTool<any>[]>(
  config: { readonly tools: Tools }
): ToolbarConfig<ToolbarToolRequirements<Tools[number]>> & { readonly tools: Tools } {
  const duplicateId = findDuplicateToolId(config.tools);

  if (duplicateId) {
    throw new DuplicateToolbarToolIdError({ id: duplicateId });
  }

  return config;
}

export function toToolbarToolMetadata(tool: ToolbarTool) {
  return {
    id: tool.id,
    label: tool.label,
    routes: Object.keys(tool.routes ?? {}).sort()
  };
}

function findDuplicateToolId(tools: readonly ToolbarTool<any>[]): string | undefined {
  const ids = new Set<string>();

  for (const tool of tools) {
    if (ids.has(tool.id)) {
      return tool.id;
    }

    ids.add(tool.id);
  }

  return undefined;
}

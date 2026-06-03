import {
  ToolbarErrorEnvelopeSchema,
  toToolbarToolMetadata,
  type ToolbarConfig as ToolbarConfigData,
  type ToolbarToolMetadata,
  type ToolDefinition
} from "@repo/core";
import { ToolbarConfig } from "@repo/config";
import { Context, Effect, Layer, Schema } from "effect";

export class ToolbarToolDispatch extends Context.Service<ToolbarToolDispatch, {
  readonly metadata: Effect.Effect<readonly ToolbarToolMetadata[]>;
  readonly tool: (toolId: string) => Effect.Effect<ToolbarToolMetadata, ToolbarProtocolError>;
}>()("@repo/server/ToolbarToolDispatch") {
  static readonly layer = Layer.effect(
    ToolbarToolDispatch,
    Effect.gen(function*() {
      const config = yield* ToolbarConfig;

      return ToolbarToolDispatch.of({
        metadata: Effect.succeed(config.tools.map((registration) => toToolbarToolMetadata(registration.tool))),
        tool: Effect.fn("ToolbarToolDispatch.tool")(function*(toolId) {
          const tool = findTool(config, toolId);

          if (!tool) {
            return yield* new ToolbarProtocolError({
              error: { code: "UNKNOWN_TOOL", message: "Unknown tool" },
              status: 404
            });
          }

          return toToolbarToolMetadata(tool);
        })
      });
    })
  );
}

export class ToolbarProtocolError extends Schema.TaggedErrorClass<ToolbarProtocolError>()(
  "ToolbarProtocolError",
  {
    error: ToolbarErrorEnvelopeSchema.fields.error,
    status: Schema.Number
  }
) {}

function findTool(config: ToolbarConfigData, toolId: string): ToolDefinition | undefined {
  return config.tools.find((candidate) => candidate.tool.id === toolId)?.tool;
}

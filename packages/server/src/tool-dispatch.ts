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
  readonly route: (toolId: string, routePath: string, request: Request) => Effect.Effect<unknown, ToolbarProtocolError>;
}>()("@repo/server/ToolbarToolDispatch") {
  static readonly layer = Layer.effect(
    ToolbarToolDispatch,
    Effect.gen(function*() {
      const config = yield* ToolbarConfig;

      return ToolbarToolDispatch.of({
        metadata: Effect.succeed(config.tools.map(toToolbarToolMetadata)),
        tool: Effect.fn("ToolbarToolDispatch.tool")(function*(toolId) {
          const tool = findTool(config, toolId);

          if (!tool) {
            return yield* new ToolbarProtocolError({
              error: { code: "UNKNOWN_TOOL", message: "Unknown tool" },
              status: 404
            });
          }

          return toToolbarToolMetadata(tool);
        }),
        route: Effect.fn("ToolbarToolDispatch.route")(function*(toolId, routePath, request) {
          const tool = findTool(config, toolId);

          if (!tool) {
            return yield* new ToolbarProtocolError({
              error: { code: "UNKNOWN_TOOL", message: "Unknown tool" },
              status: 404
            });
          }

          const route = tool.routes?.[routePath];

          if (!route) {
            return yield* new ToolbarProtocolError({
              error: { code: "UNKNOWN_TOOL_ROUTE", message: "Unknown tool route" },
              status: 404
            });
          }

          return yield* route(request).pipe(
            Effect.catch(() =>
              Effect.fail(new ToolbarProtocolError({
                error: { code: "TOOL_ERROR", message: "Tool route failed" },
                status: 500
              })))
          );
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
  return config.tools.find((candidate) => candidate.id === toolId);
}

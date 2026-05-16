import { expect, it } from "@effect/vitest";
import { Effect, Schema } from "effect";
import {
  ToolbarErrorEnvelopeSchema,
  ToolbarRootDataSchema,
  ToolbarSuccessEnvelopeSchema,
  toolbarApiRoutes,
  toolbarError,
  toolbarSuccess
} from "../src/index.ts";

it.effect("validates the root success envelope schema", () =>
  Effect.gen(function*() {
    const RootResponseSchema = ToolbarSuccessEnvelopeSchema(ToolbarRootDataSchema);
    const decoded = yield* Schema.decodeUnknownEffect(RootResponseSchema)(
      toolbarSuccess({
        apiVersion: 1,
        tools: [
          {
            id: "worktrees",
            label: "Worktrees",
            routes: ["index"]
          }
        ]
      })
    );

    expect(decoded.data.tools[0]?.id).toBe("worktrees");
  }));

it.effect("validates the error envelope schema", () =>
  Effect.gen(function*() {
    const decoded = yield* Schema.decodeUnknownEffect(ToolbarErrorEnvelopeSchema)(
      toolbarError({
        code: "UNKNOWN_TOOL",
        message: "Unknown tool"
      })
    );

    expect(decoded.error.code).toBe("UNKNOWN_TOOL");
  }));

it("documents the initial API route constants", () => {
  expect(toolbarApiRoutes.root).toBe("/__toolbar");
  expect(toolbarApiRoutes.tools).toBe("/__toolbar/tools");
  expect(toolbarApiRoutes.toolRoute).toBe("/__toolbar/tools/:toolId/*routePath");
});

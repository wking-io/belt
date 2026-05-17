import { assert, it } from "@effect/vitest";
import { Effect, Schema } from "effect";
import {
  ToolbarErrorEnvelopeSchema,
  ToolbarRootDataSchema,
  ToolbarSuccessEnvelopeSchema,
  toolbarApiRelativeRoutes,
  toolbarApiRoutes,
  toolbarApiToolPath,
  toolbarApiToolRelativePath,
  toolbarApiToolRoutePath,
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

    assert.strictEqual(decoded.data.tools[0]?.id, "worktrees");
  }));

it.effect("validates the error envelope schema", () =>
  Effect.gen(function*() {
    const decoded = yield* Schema.decodeUnknownEffect(ToolbarErrorEnvelopeSchema)(
      toolbarError({
        code: "UNKNOWN_TOOL",
        message: "Unknown tool"
      })
    );

    assert.strictEqual(decoded.error.code, "UNKNOWN_TOOL");
  }));

it("documents the initial API route constants", () => {
  assert.strictEqual(toolbarApiRoutes.root, "/__toolbar");
  assert.strictEqual(toolbarApiRoutes.tools, "/__toolbar/tools");
  assert.strictEqual(toolbarApiRoutes.toolRoute, "/__toolbar/tools/:toolId/*routePath");
  assert.strictEqual(toolbarApiRelativeRoutes.toolRoute, "/tools/:toolId/*");
});

it("builds concrete API paths from the protocol model", () => {
  assert.strictEqual(toolbarApiToolRelativePath("worktrees"), "/tools/worktrees");
  assert.strictEqual(toolbarApiToolPath("worktrees"), "/__toolbar/tools/worktrees");
  assert.strictEqual(toolbarApiToolRoutePath("worktrees", "branches/list"), "/__toolbar/tools/worktrees/branches/list");
  assert.strictEqual(toolbarApiToolRoutePath("worktrees", "/branches/list"), "/__toolbar/tools/worktrees/branches/list");
});

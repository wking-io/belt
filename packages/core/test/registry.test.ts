import { assert, it } from "@effect/vitest";
import { Effect, Schema } from "effect";
import {
  defineToolbar,
  defineTool,
  DuplicateToolbarToolIdError,
  ToolDefinitionSchema,
  ToolbarToolSchema,
  toToolbarToolMetadata,
  validateToolbarConfig,
  type ToolDefinition
} from "../src/index.ts";

it.effect("validates explicit tool registration", () =>
  Effect.gen(function*() {
    const config = yield* validateToolbarConfig({
      tools: [
        {
          id: "worktrees",
          label: "Worktrees",
          routes: {
            index: () => Effect.succeed({ worktrees: [] })
          }
        }
      ]
    });

    assert.strictEqual(config.tools[0]?.id, "worktrees");
  }));

it.effect("validates toolbar tool data with the source-of-truth schema", () =>
  Effect.gen(function*() {
    const tool = yield* Schema.decodeUnknownEffect(ToolbarToolSchema)({
      id: "worktrees",
      label: "Worktrees"
    });

    assert.deepStrictEqual(tool, {
      id: "worktrees",
      label: "Worktrees"
    });
  }));

it.effect("validates tool definitions with schema-backed reference fields", () =>
  Effect.gen(function*() {
    const tool = yield* Schema.decodeUnknownEffect(ToolDefinitionSchema)({
      id: "worktrees",
      label: "Worktrees",
      routes: {
        index: () => Effect.succeed({ worktrees: [] })
      }
    });

    assert.strictEqual(tool.id, "worktrees");
    assert.strictEqual(typeof tool.routes?.index, "function");
  }));

it("throws from defineTool for invalid tool definitions", () => {
  assert.throws(() =>
    defineTool({
      id: "",
      label: "Worktrees"
    })
  );
});

it.effect("fails validation for duplicate tool ids with a typed error", () =>
  Effect.gen(function*() {
    const duplicateId = yield* Effect.catchTag(
      validateToolbarConfig({
        tools: [
          { id: "worktrees", label: "Worktrees" },
          { id: "worktrees", label: "Worktrees again" }
        ]
      }),
      "DuplicateToolbarToolIdError",
      (error) => Effect.succeed(error.id)
    );

    assert.strictEqual(duplicateId, "worktrees");
  }));

it("throws a typed error from defineToolbar for invalid module config registration", () => {
  assert.throws(
    () =>
      defineToolbar({
        tools: [
          { id: "worktrees", label: "Worktrees" },
          { id: "worktrees", label: "Worktrees again" }
        ]
      }),
    DuplicateToolbarToolIdError
  );
});

it("derives tool metadata from route contributions", () => {
  const tool: ToolDefinition = {
    id: "worktrees",
    label: "Worktrees",
    routes: {
      "destinations/check": () => Effect.succeed({ ok: true }),
      index: () => Effect.succeed({ worktrees: [] })
    }
  };

  assert.deepStrictEqual(toToolbarToolMetadata(tool), {
    id: "worktrees",
    label: "Worktrees",
    routes: ["destinations/check", "index"]
  });
});

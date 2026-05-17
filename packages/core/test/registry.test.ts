import { assert, it } from "@effect/vitest";
import { Effect } from "effect";
import {
  defineToolbar,
  DuplicateToolbarToolIdError,
  toToolbarToolMetadata,
  validateToolbarConfig,
  type ToolbarTool
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
  const tool: ToolbarTool = {
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

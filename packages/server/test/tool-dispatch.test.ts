import { assert, describe, it } from "@effect/vitest";
import { ToolbarConfig } from "@repo/config";
import { defineToolbar } from "@repo/core";
import { Effect, Layer } from "effect";
import { ToolbarProtocolError, ToolbarToolDispatch } from "../src/tool-dispatch.ts";

describe("ToolbarToolDispatch", () => {
  it.effect("returns registered tool metadata through the dispatch interface", () =>
    Effect.gen(function*() {
      const dispatch = yield* ToolbarToolDispatch;
      const tool = yield* dispatch.tool("worktrees");

      assert.deepStrictEqual(tool, {
        id: "worktrees",
        label: "Worktrees",
        routes: ["index"]
      });
    }).pipe(Effect.provide(testLayer)));

  it.effect("maps missing routes to protocol errors", () =>
    Effect.gen(function*() {
      const dispatch = yield* ToolbarToolDispatch;
      const error = yield* Effect.flip(dispatch.route("worktrees", "missing", request()));

      assert.ok(error instanceof ToolbarProtocolError);
      assert.strictEqual(error.status, 404);
      assert.deepStrictEqual(error.error, {
        code: "UNKNOWN_TOOL_ROUTE",
        message: "Unknown tool route"
      });
    }).pipe(Effect.provide(testLayer)));
});

const testConfig = defineToolbar({
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

const testLayer = Layer.provide(ToolbarToolDispatch.layer, ToolbarConfig.layer(testConfig));

function request(): Request {
  return new Request("http://belt.local/__toolbar/tools/worktrees");
}

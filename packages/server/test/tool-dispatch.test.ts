import { assert, describe, it } from "@effect/vitest";
import { ToolbarConfig } from "@repo/config";
import { defineToolbar } from "@repo/core";
import { Effect, Layer } from "effect";
import { ToolbarProtocolError, ToolbarToolDispatch } from "../src/tool-dispatch.ts";
import { createToolbarServer } from "../src/index.ts";

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

  it.effect("dispatches non-GET tool route requests through the server", () =>
    Effect.gen(function*() {
      const server = createToolbarServer(defineToolbar({
        tools: [
          {
            id: "echo",
            label: "Echo",
            routes: {
              submit: (request) =>
                Effect.promise(async () => ({
                  method: request.method,
                  body: await request.json()
                }))
            }
          }
        ]
      }));

      try {
        const response = yield* Effect.promise(() =>
          server.fetch(new Request("http://belt.local/__toolbar/tools/echo/submit", {
            method: "POST",
            body: JSON.stringify({ ok: true }),
            headers: {
              "content-type": "application/json"
            }
          }))
        );

        assert.strictEqual(response.status, 200);
        assert.deepStrictEqual(yield* Effect.promise(() => response.json()), {
          ok: true,
          data: {
            method: "POST",
            body: {
              ok: true
            }
          }
        });
      } finally {
        yield* Effect.promise(() => server.dispose());
      }
    }));
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

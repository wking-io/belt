import { assert, describe, it } from "@effect/vitest";
import { defineToolbar } from "@repo/core";
import { Effect } from "effect";
import { createToolbarFetchHandler } from "../src/index.ts";

describe("Fetch Toolbar adapter", () => {
  it.effect("exposes a Fetch-compatible handler backed by the Toolbar Server", () =>
    Effect.gen(function*() {
      const handler = createToolbarFetchHandler(testConfig);
      const response = yield* Effect.promise(() => handler(request("/__toolbar/tools/worktrees/")));
      const body = yield* json(response);

      assert.strictEqual(response.status, 200);
      assert.deepStrictEqual(body, {
        ok: true,
        data: {
          worktrees: []
        }
      });

      yield* Effect.promise(() => handler.dispose());
    }));

  it.effect("preserves Toolbar API protocol errors", () =>
    Effect.gen(function*() {
      const handler = createToolbarFetchHandler(testConfig);
      const response = yield* Effect.promise(() => handler(request("/__toolbar/tools/missing")));
      const body = yield* json(response);

      assert.strictEqual(response.status, 404);
      assert.deepStrictEqual(body, {
        ok: false,
        error: {
          code: "UNKNOWN_TOOL",
          message: "Unknown tool"
        }
      });

      yield* Effect.promise(() => handler.dispose());
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

function request(pathname: string): Request {
  return new Request(new URL(pathname, "http://belt.local"));
}

function json(response: Response) {
  return Effect.promise(() => response.json() as Promise<unknown>);
}

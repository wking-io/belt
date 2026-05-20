import { assert, describe, it } from "@effect/vitest";
import { defineToolbar } from "@repo/core";
import { Effect } from "effect";
import { createToolbarRouteHandler } from "../src/index.ts";

describe("Remix Toolbar adapter", () => {
  it.effect("exposes a Remix route-shaped handler for explicit route mounting", () =>
    Effect.gen(function*() {
      const handler = createToolbarRouteHandler(testConfig);
      const response = yield* Effect.promise(() =>
        handler({
          request: request("/__toolbar")
        })
      );
      const body = yield* json(response);

      assert.strictEqual(response.status, 200);
      assert.deepStrictEqual(body, {
        ok: true,
        data: {
          apiVersion: 1,
          tools: [
            {
              id: "worktrees",
              label: "Worktrees",
              routes: ["index"]
            }
          ]
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
  return Effect.promise(async (): Promise<unknown> => response.json());
}

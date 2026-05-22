import { assert, describe, it } from "@effect/vitest";
import { defineToolbar, defineToolbarDefinition, normalizeRoute } from "@repo/core";
import { Effect, Schema } from "effect";
import { HttpApi, HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";
import { HttpApiBuilder } from "effect/unstable/httpapi";
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

  it.effect("accepts Toolbar Definitions at the adapter entry point", () =>
    Effect.gen(function*() {
      const handler = createToolbarRouteHandler(defineToolbarDefinition({ toolbarConfig: testConfig }));
      const response = yield* Effect.promise(() =>
        handler({
          request: request("/__toolbar")
        })
      );

      assert.strictEqual(response.status, 200);

      yield* Effect.promise(() => handler.dispose());
    }));
});

const WorktreesIndexResponseSchema = Schema.Struct({
  worktrees: Schema.Array(Schema.Unknown)
});

class WorktreesTestApiGroup extends HttpApiGroup.make("worktrees-test")
  .add(
    HttpApiEndpoint.get("index", normalizeRoute("index"), {
      success: WorktreesIndexResponseSchema
    })
  )
{}

class WorktreesTestApi extends HttpApi.make("worktrees-test-api")
  .add(WorktreesTestApiGroup)
{}

const WorktreesTestApiHandlers = HttpApiBuilder.group(
  WorktreesTestApi,
  "worktrees-test",
  (handlers) =>
    handlers.handle("index", () => Effect.succeed({ worktrees: [] }))
);

const testConfig = defineToolbar({
  tools: [
    {
      api: WorktreesTestApi,
      apiLayer: WorktreesTestApiHandlers,
      id: "worktrees",
      label: "Worktrees"
    }
  ]
});

function request(pathname: string): Request {
  return new Request(new URL(pathname, "http://belt.local"));
}

function json(response: Response) {
  return Effect.promise(async (): Promise<unknown> => response.json());
}

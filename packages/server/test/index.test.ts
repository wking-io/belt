import { assert, describe, it } from "@effect/vitest";
import {
  defineToolbar,
  defineToolbarDefinition,
  normalizeRoute,
  toolbarApiRoutes,
  toolbarApiToolPath,
  toolbarApiToolRoutePath,
  type ToolbarErrorCode
} from "@repo/core";
import { iterationsTool } from "@repo/tool-iterations";
import { Effect, Schema } from "effect";
import { HttpApi, HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { createToolbarServer } from "../src/index.ts";

describe("Effect HTTP Toolbar Server", () => {
  it.effect("serves root metadata through the protocol envelope", () =>
    Effect.gen(function*() {
      const server = createToolbarServer(testConfig);
      const response = yield* Effect.promise(() => server.fetch(request(toolbarApiRoutes.root)));
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

      yield* Effect.promise(() => server.dispose());
    }));

  it.effect("serves registered tool metadata", () =>
    Effect.gen(function*() {
      const server = createToolbarServer(testConfig);
      const response = yield* Effect.promise(() => server.fetch(request(toolbarApiToolPath("worktrees"))));
      const body = yield* json(response);

      assert.strictEqual(response.status, 200);
      assert.deepStrictEqual(body, {
        ok: true,
        data: {
          tool: {
            id: "worktrees",
            label: "Worktrees",
            routes: ["index"]
          }
        }
      });

      yield* Effect.promise(() => server.dispose());
    }));

  it.effect("accepts Toolbar Definitions at the server entry point", () =>
    Effect.gen(function*() {
      const server = createToolbarServer(defineToolbarDefinition({ toolbarConfig: testConfig }));
      const response = yield* Effect.promise(() => server.fetch(request(toolbarApiRoutes.root)));
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

      yield* Effect.promise(() => server.dispose());
    }));

  it.effect("dispatches tool-owned routes", () =>
    Effect.gen(function*() {
      const server = createToolbarServer(testConfig);
      const indexResponse = yield* Effect.promise(() => server.fetch(request(toolbarApiToolRoutePath("worktrees", "/"))));

      assert.strictEqual(indexResponse.status, 200);
      assert.deepStrictEqual(yield* json(indexResponse), {
        worktrees: []
      });

      yield* Effect.promise(() => server.dispose());
    }));

  it.effect("dispatches the canonical Iterations tool route", () =>
    Effect.gen(function*() {
      const server = createToolbarServer(defineToolbar({
        tools: [
          iterationsTool({
            providers: [
              {
                id: "test",
                label: "Test",
                list: () => Effect.succeed([
                  {
                    id: "prototype:pricing-test",
                    label: "pricing-test",
                    kind: "prototype",
                    current: false,
                    destinations: [
                      {
                        id: "preview",
                        label: "Preview",
                        primary: true,
                        url: "/__prototype/pricing-test"
                      }
                    ]
                  }
                ])
              }
            ]
          })
        ]
      }));
      const indexResponse = yield* Effect.promise(() => server.fetch(request(toolbarApiToolRoutePath("iterations", "/"))));

      assert.strictEqual(indexResponse.status, 200);
      assert.deepStrictEqual(yield* json(indexResponse), {
        iterations: [
          {
            id: "prototype:pricing-test",
            label: "pricing-test",
            kind: "prototype",
            current: false,
            destinations: [
              {
                id: "preview",
                label: "Preview",
                primary: true,
                url: "/__prototype/pricing-test"
              }
            ]
          }
        ]
      });

      yield* Effect.promise(() => server.dispose());
    }));

  it.effect("returns protocol errors for unknown resources", () =>
    Effect.gen(function*() {
      const server = createToolbarServer(testConfig);

      yield* assertError(server, "/elsewhere", 404, "NOT_FOUND");
      yield* assertError(server, toolbarApiToolPath("missing"), 404, "UNKNOWN_TOOL");

      yield* Effect.promise(() => server.dispose());
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

const assertError = Effect.fn("assertError")(function*(
  server: ReturnType<typeof createToolbarServer>,
  pathname: string,
  status: number,
  code: ToolbarErrorCode
) {
  const response = yield* Effect.promise(() => server.fetch(request(pathname)));
  const body = yield* json(response);

  assert.strictEqual(response.status, status);
  assert.deepStrictEqual(body, {
    ok: false,
    error: {
      code,
      message: errorMessageFor(code)
    }
  });
});

function errorMessageFor(code: ToolbarErrorCode): string {
  switch (code) {
    case "NOT_FOUND":
      return "Not found";
    case "UNKNOWN_TOOL":
      return "Unknown tool";
    default:
      return code;
  }
}

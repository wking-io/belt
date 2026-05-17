import { assert, describe, it } from "@effect/vitest";
import {
  defineToolbar,
  toolbarApiRoutes,
  toolbarApiToolPath,
  toolbarApiToolRoutePath,
  type ToolbarErrorCode
} from "@repo/core";
import { Effect } from "effect";
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
              routes: ["branches/list", "index"]
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
            routes: ["branches/list", "index"]
          }
        }
      });

      yield* Effect.promise(() => server.dispose());
    }));

  it.effect("dispatches tool-owned routes", () =>
    Effect.gen(function*() {
      const server = createToolbarServer(testConfig);
      const indexResponse = yield* Effect.promise(() => server.fetch(request(toolbarApiToolRoutePath("worktrees", "/"))));
      const nestedResponse = yield* Effect.promise(() => server.fetch(request(toolbarApiToolRoutePath("worktrees", "branches/list"))));

      assert.deepStrictEqual(yield* json(indexResponse), {
        ok: true,
        data: {
          worktrees: []
        }
      });
      assert.deepStrictEqual(yield* json(nestedResponse), {
        ok: true,
        data: {
          branches: ["main"]
        }
      });

      yield* Effect.promise(() => server.dispose());
    }));

  it.effect("returns protocol errors for unknown resources", () =>
    Effect.gen(function*() {
      const server = createToolbarServer(testConfig);

      yield* assertError(server, "/elsewhere", 404, "NOT_FOUND");
      yield* assertError(server, toolbarApiToolPath("missing"), 404, "UNKNOWN_TOOL");
      yield* assertError(server, toolbarApiToolRoutePath("worktrees", "missing"), 404, "UNKNOWN_TOOL_ROUTE");

      yield* Effect.promise(() => server.dispose());
    }));

  it.effect("maps tool failures to TOOL_ERROR", () =>
    Effect.gen(function*() {
      const server = createToolbarServer(failingConfig);

      yield* assertError(server, toolbarApiToolRoutePath("failing", "/"), 500, "TOOL_ERROR");

      yield* Effect.promise(() => server.dispose());
    }));
});

const testConfig = defineToolbar({
  tools: [
    {
      id: "worktrees",
      label: "Worktrees",
      routes: {
        "branches/list": () => Effect.succeed({ branches: ["main"] }),
        index: () => Effect.succeed({ worktrees: [] })
      }
    }
  ]
});

const failingConfig = defineToolbar({
  tools: [
    {
      id: "failing",
      label: "Failing",
      routes: {
        index: () => Effect.fail("boom")
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
    case "UNKNOWN_TOOL_ROUTE":
      return "Unknown tool route";
    case "TOOL_ERROR":
      return "Tool route failed";
    default:
      return code;
  }
}

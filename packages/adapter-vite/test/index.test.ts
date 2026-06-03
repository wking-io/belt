import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { once } from "node:events";
import { assert, describe, it } from "@effect/vitest";
import { defineToolbar, normalizeRoute, toolbarApiBasePath } from "@repo/core";
import { Effect, Schema } from "effect";
import { HttpApi, HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import type { Connect, ViteDevServer } from "vite";
import { toolbarVite } from "../src/index.ts";

describe("Vite Toolbar adapter", () => {
  it.effect("mounts the Toolbar API under /__toolbar", () =>
    Effect.gen(function*() {
      const mounted = mountToolbarVite();

      assert.strictEqual(mounted.path, toolbarApiBasePath);

      const response = yield* Effect.promise(() => mounted.fetch("/"));
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

      mounted.close();
    }));

  it.effect("translates mounted child paths into Toolbar API requests", () =>
    Effect.gen(function*() {
      const mounted = mountToolbarVite();
      const response = yield* Effect.promise(() => mounted.fetch("/tools/worktrees/"));
      const body = yield* json(response);

      assert.strictEqual(response.status, 200);
      assert.deepStrictEqual(body, {
        worktrees: []
      });

      mounted.close();
    }));

  it.effect("preserves Toolbar API protocol errors", () =>
    Effect.gen(function*() {
      const mounted = mountToolbarVite();
      const response = yield* Effect.promise(() => mounted.fetch("/tools/missing"));
      const body = yield* json(response);

      assert.strictEqual(response.status, 404);
      assert.deepStrictEqual(body, {
        ok: false,
        error: {
          code: "UNKNOWN_TOOL",
          message: "Unknown tool"
        }
      });

      mounted.close();
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
      tool: {
        api: WorktreesTestApi,
        apiLayer: WorktreesTestApiHandlers,
        id: "worktrees",
        label: "Worktrees"
      }
    }
  ]
});

function mountToolbarVite() {
  let path = "";
  let handler: Connect.NextHandleFunction | undefined;

  const plugin = toolbarVite(testConfig);

  if (typeof plugin.configureServer !== "function") {
    throw new Error("Vite plugin did not expose configureServer");
  }

  plugin.configureServer(testViteServer({
    use: (mountPath: string, nextHandler: Connect.NextHandleFunction) => {
      path = mountPath;
      handler = nextHandler;
    }
  }));

  if (!handler) {
    throw new Error("Vite plugin did not register middleware");
  }

  const middleware = handler;
  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    middleware(req, res, (error?: unknown) => {
      res.statusCode = 500;
      res.end(error instanceof Error ? error.message : "Middleware failed");
    });
  });

  return {
    path,
    async fetch(pathname: string) {
      server.listen(0);
      await waitForListening(server);

      const address = server.address();

      if (!address || typeof address === "string") {
        throw new Error("Test server did not bind to a TCP port");
      }

      return fetch(new URL(pathname, `http://127.0.0.1:${address.port}`));
    },
    close() {
      server.close();
    }
  };
}

async function waitForListening(server: ReturnType<typeof createServer>) {
  if (server.listening) return;

  await once(server, "listening");
}

function json(response: Response) {
  return Effect.promise(async (): Promise<unknown> => response.json());
}

function testViteServer(middlewares: ViteDevServer["middlewares"]): ViteDevServer {
  return Object.assign(Object.create(null), { middlewares });
}

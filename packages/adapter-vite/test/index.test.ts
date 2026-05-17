import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { once } from "node:events";
import { assert, describe, it } from "@effect/vitest";
import { defineToolbar, toolbarApiBasePath } from "@repo/core";
import { Effect } from "effect";
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
        ok: true,
        data: {
          worktrees: []
        }
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

function mountToolbarVite() {
  let path = "";
  let handler: Connect.NextHandleFunction | undefined;

  const plugin = toolbarVite(testConfig);

  if (typeof plugin.configureServer !== "function") {
    throw new Error("Vite plugin did not expose configureServer");
  }

  plugin.configureServer({
    middlewares: {
      use: (mountPath: string, nextHandler: Connect.NextHandleFunction) => {
        path = mountPath;
        handler = nextHandler;
      }
    }
  } as ViteDevServer);

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
  return Effect.promise(() => response.json() as Promise<unknown>);
}

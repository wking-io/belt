import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { NodeFileSystem, NodePath } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { ToolbarConfigService } from "@repo/config";
import { toolbarApiRoutes, toolbarApiToolPath, toolbarApiToolRoutePath } from "@repo/core";
import { createToolbarServer } from "@repo/server";
import { Effect, Layer } from "effect";
import type { Connect, ViteDevServer } from "vite";
import { createToolbarRouteHandler } from "../../adapter-remix/src/index.ts";
import { toolbarVite } from "../../adapter-vite/src/index.ts";

describe("backend v1 integration", () => {
  it.effect("loads config and serves the same Toolbar protocol through server, Remix, and Vite", () =>
    withFixture(Effect.fn(function*(fixture) {
      const configService = yield* ToolbarConfigService;
      const config = yield* configService.load({ cwd: fixture.appRoot });

      assert.strictEqual(config.tools[0]?.id, "worktrees");

      const server = createToolbarServer(config);
      const remix = createToolbarRouteHandler(config);
      const vite = mountToolbarVite(config);

      try {
        yield* assertRootResponse(() => server.fetch(request(toolbarApiRoutes.root)));
        yield* assertRootResponse(() => remix({ request: request(toolbarApiRoutes.root) }));
        yield* assertRootResponse(() => vite.fetch("/"));

        const worktreesResponse = yield* Effect.promise(() =>
          server.fetch(request(toolbarApiToolRoutePath("worktrees", "/")))
        );
        const worktreesBody = yield* json(worktreesResponse);

        assert.strictEqual(worktreesResponse.status, 200);
        assert.deepStrictEqual(worktreesBody, {
          worktrees: [
            {
              id: "main",
              branch: "main",
              path: fixture.repoRoot,
              current: true,
              destinations: [
                {
                  id: "web",
                  label: "Web",
                  primary: true,
                  url: "https://example.localhost"
                }
              ]
            },
            {
              id: "fix-ui",
              branch: "fix-ui",
              path: fixture.worktreeRoot,
              current: false,
              destinations: [
                {
                  id: "web",
                  label: "Web",
                  primary: true,
                  url: "https://fix-ui.example.localhost"
                }
              ]
            }
          ]
        });

        const missingResponse = yield* Effect.promise(() => remix({ request: request(toolbarApiToolPath("missing")) }));
        const missingBody = yield* json(missingResponse);

        assert.strictEqual(missingResponse.status, 404);
        assert.deepStrictEqual(missingBody, {
          ok: false,
          error: {
            code: "UNKNOWN_TOOL",
            message: "Unknown tool"
          }
        });
      } finally {
        yield* Effect.promise(() => server.dispose());
        yield* Effect.promise(() => remix.dispose());
        vite.close();
      }
    })).pipe(Effect.provide(configServiceLayer)));
});

type Fixture = {
  readonly appRoot: string;
  readonly repoRoot: string;
  readonly worktreeRoot: string;
};

function withFixture<A, E, R>(run: (fixture: Fixture) => Effect.Effect<A, E, R>) {
  return Effect.acquireUseRelease(
    Effect.promise(async () => {
      const appRoot = await mkdtemp(join(process.cwd(), ".tmp-backend-v1-"));
      const repoRoot = join(appRoot, "repo");
      const worktreeRoot = join(appRoot, "repo-fix-ui");

      await git(appRoot, ["init", "-b", "main", repoRoot]);
      await writeFile(join(repoRoot, "README.md"), "# Test repo\n");
      await git(repoRoot, ["config", "user.email", "belt@example.test"]);
      await git(repoRoot, ["config", "user.name", "Belt Test"]);
      await git(repoRoot, ["add", "README.md"]);
      await git(repoRoot, ["commit", "-m", "Initial commit"]);
      await git(repoRoot, ["worktree", "add", "-b", "fix-ui", worktreeRoot]);
      await writeToolbarConfig(appRoot, repoRoot);

      return { appRoot, repoRoot, worktreeRoot };
    }),
    run,
    (fixture) => Effect.promise(() => rm(fixture.appRoot, { force: true, recursive: true }))
  );
}

async function writeToolbarConfig(appRoot: string, repoRoot: string) {
  const workspaceRoot = process.cwd();
  const coreUrl = pathToFileURL(join(workspaceRoot, "packages/core/src/index.ts")).href;
  const worktreesUrl = pathToFileURL(join(workspaceRoot, "packages/tool-worktrees/src/index.ts")).href;
  const portlessUrl = pathToFileURL(join(workspaceRoot, "packages/tool-worktrees-extension-portless/src/index.ts")).href;

  await writeFile(
    join(appRoot, "toolbar.config.mjs"),
    `
      import { defineToolbar } from ${JSON.stringify(coreUrl)};
      import { worktreesTool } from ${JSON.stringify(worktreesUrl)};
      import { portlessResolver } from ${JSON.stringify(portlessUrl)};

      export default defineToolbar({
        tools: [
          worktreesTool({
            cwd: ${JSON.stringify(repoRoot)},
            resolver: portlessResolver({
              destinations: [
                {
                  id: "web",
                  label: "Web",
                  appName: "example"
                }
              ]
            })
          })
        ]
      });
    `
  );
}

async function git(cwd: string, args: readonly string[]) {
  const child = spawn("git", [...args], {
    cwd,
    stdio: ["ignore", "ignore", "pipe"]
  });
  const [exitCode, stderr] = await Promise.all([
    new Promise<number>((resolve) => {
      child.once("close", (code) => resolve(code ?? 1));
    }),
    new Response(child.stderr).text()
  ]);

  if (exitCode !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${stderr}`);
  }
}

function request(pathname: string): Request {
  return new Request(new URL(pathname, "http://belt.local"));
}

function json(response: Response) {
  return Effect.promise(async (): Promise<unknown> => response.json());
}

function testViteServer(middlewares: ViteDevServer["middlewares"]): ViteDevServer {
  return Object.assign(Object.create(null), { middlewares });
}

const assertRootResponse = Effect.fn("assertRootResponse")(function*(fetchResponse: () => Promise<Response>) {
  const response = yield* Effect.promise(fetchResponse);
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
});

function mountToolbarVite(config: Parameters<typeof toolbarVite>[0]) {
  let handler: Connect.NextHandleFunction | undefined;
  const plugin = toolbarVite(config);

  if (typeof plugin.configureServer !== "function") {
    throw new Error("Vite plugin did not expose configureServer");
  }

  plugin.configureServer(testViteServer({
    use: (_mountPath: string, nextHandler: Connect.NextHandleFunction) => {
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

const configServiceLayer = Layer.provide(
  ToolbarConfigService.layer,
  Layer.mergeAll(NodeFileSystem.layer, NodePath.layer)
);

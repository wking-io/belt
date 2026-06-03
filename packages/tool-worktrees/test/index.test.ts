import { createServer, type Server, type ServerResponse } from "node:http";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Context, Effect, Layer } from "effect";
import { FetchHttpClient, HttpRouter, HttpServer } from "effect/unstable/http";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import {
  GitWorktreeParseError,
  WorktreeResolverError,
  makeWorktreesToolClient,
  parseGitWorktreeList,
  toWorktreeEntries,
  worktreesTool
} from "../src/index.ts";

describe("parseGitWorktreeList", () => {
  it.effect("parses git worktree porcelain output", () =>
    Effect.gen(function*() {
      const worktrees = yield* parseGitWorktreeList(`worktree /repo/myapp
HEAD 1111111111111111111111111111111111111111
branch refs/heads/main

worktree /repo/myapp-fix-ui
HEAD 2222222222222222222222222222222222222222
branch refs/heads/fix-ui
`);

      assert.deepStrictEqual(worktrees, [
        {
          branch: "main",
          detached: false,
          path: "/repo/myapp"
        },
        {
          branch: "fix-ui",
          detached: false,
          path: "/repo/myapp-fix-ui"
        }
      ]);
    }));

  it.effect("parses detached worktrees with a defined detached branch label", () =>
    Effect.gen(function*() {
      const worktrees = yield* parseGitWorktreeList(`worktree /repo/myapp-detached
HEAD 3333333333333333333333333333333333333333
detached
`);

      assert.deepStrictEqual(worktrees, [
        {
          branch: "detached",
          detached: true,
          path: "/repo/myapp-detached"
        }
      ]);
    }));

  it.effect("returns an empty list for empty porcelain output", () =>
    Effect.gen(function*() {
      const worktrees = yield* parseGitWorktreeList("");

      assert.deepStrictEqual(worktrees, []);
    }));

  it.effect("fails with a typed parse error when a block has no worktree path", () =>
    Effect.gen(function*() {
      const error = yield* parseGitWorktreeList(`HEAD 4444444444444444444444444444444444444444
branch refs/heads/main
`).pipe(
        Effect.flip
      );

      assert.ok(error instanceof GitWorktreeParseError);
      assert.strictEqual(error._tag, "GitWorktreeParseError");
    }));
});

describe("toWorktreeEntries", () => {
  it.effect("marks the current worktree by resolved worktree root path", () =>
    Effect.gen(function*() {
      const entries = yield* toWorktreeEntries({
        currentPath: "/repo/myapp",
        resolvePath: (...segments) => segments.join("/"),
        resolver: {
          resolve: (worktree) => [
            {
              id: "web",
              label: "Web",
              url: `https://${worktree.branch}.myapp.localhost`
            }
          ]
        },
        worktrees: [
          { branch: "main", detached: false, path: "/repo/myapp" },
          { branch: "fix-ui", detached: false, path: "/repo/myapp-fix-ui" }
        ]
      });

      assert.deepStrictEqual(entries.map((entry) => [entry.branch, entry.current]), [
        ["main", true],
        ["fix-ui", false]
      ]);
    }));

  it.effect("surfaces resolver failures as typed errors", () =>
    Effect.gen(function*() {
      const error = yield* toWorktreeEntries({
        currentPath: "/repo/myapp",
        resolvePath: (...segments) => segments.join("/"),
        resolver: {
          resolve: () => Effect.fail("resolver exploded")
        },
        worktrees: [
          { branch: "main", detached: false, path: "/repo/myapp" }
        ]
      }).pipe(Effect.flip);

      assert.ok(error instanceof WorktreeResolverError);
      assert.strictEqual(error._tag, "WorktreeResolverError");
    }));
});

describe("worktreesTool", () => {
  it.effect("returns an empty worktree list outside a git repository", () =>
    Effect.gen(function*() {
      const cwd = yield* Effect.promise(async () => mkdtemp(join(tmpdir(), "belt-worktrees-")));

      try {
        const registration = worktreesTool({
          cwd,
          resolver: {
            resolve: () => []
          }
        });
        const tool = registration.tool;
        assert.ok(tool.api);
        assert.ok(tool.apiLayer);

        const result = yield* requestToolIndex(tool);

        assert.deepStrictEqual(result, { worktrees: [] });
      } finally {
        yield* Effect.promise(async () => {
          await rm(cwd, { force: true, recursive: true });
        });
      }
    }));

  it.effect("calls the index route through the typed Worktrees tool client", () =>
    Effect.gen(function*() {
      const cwd = yield* Effect.promise(async () => mkdtemp(join(tmpdir(), "belt-worktrees-")));

      try {
        const registration = worktreesTool({
          cwd,
          resolver: {
            resolve: () => []
          }
        });

        const result = yield* withWorktreesHttpServer(registration.tool, (baseUrl) =>
          Effect.gen(function*() {
            const client = yield* makeWorktreesToolClient({ baseUrl });

            return yield* client.worktrees.index();
          }).pipe(Effect.provide(FetchHttpClient.layer)));

        assert.deepStrictEqual(result, { worktrees: [] });
      } finally {
        yield* Effect.promise(async () => {
          await rm(cwd, { force: true, recursive: true });
        });
      }
    }));
});

function requestToolIndex(tool: ReturnType<typeof worktreesTool>["tool"]) {
  if (!tool.api || !tool.apiLayer || !tool.runtimeLayer) {
    return Effect.die(new Error("Worktrees tool API registration is missing"));
  }

  const app = HttpApiBuilder.layer(tool.api).pipe(
    Layer.provide(tool.apiLayer),
    Layer.provide(tool.runtimeLayer),
    Layer.provide(HttpServer.layerServices)
  );
  const { handler, dispose } = HttpRouter.toWebHandler(app);

  return Effect.promise(() => handler(new Request("http://localhost/"), Context.empty() as Context.Context<unknown>))
    .pipe(
      Effect.flatMap((response) => Effect.promise(async (): Promise<unknown> => response.json())),
      Effect.tap(() => Effect.promise(() => dispose()))
    );
}

function withWorktreesHttpServer<A, E, R>(
  tool: ReturnType<typeof worktreesTool>["tool"],
  run: (baseUrl: string) => Effect.Effect<A, E, R>
) {
  if (!tool.api || !tool.apiLayer || !tool.runtimeLayer) {
    return Effect.die(new Error("Worktrees tool API registration is missing"));
  }

  return Effect.acquireUseRelease(
    Effect.promise(async () => {
      const app = HttpApiBuilder.layer(tool.api).pipe(
        Layer.provide(tool.apiLayer),
        Layer.provide(tool.runtimeLayer),
        Layer.provide(HttpServer.layerServices)
      );
      const { handler, dispose } = HttpRouter.toWebHandler(app);
      const server = createServer(async (req, res) => {
        try {
          const incomingUrl = new URL(req.url ?? "/", "http://localhost");
          const routePath = incomingUrl.pathname.replace(/^\/__toolbar\/tools\/worktrees/, "") || "/";
          const response = await handler(
            new Request(new URL(`${routePath}${incomingUrl.search}`, "http://localhost"), {
              method: req.method
            }),
            Context.empty() as Context.Context<unknown>
          );

          await writeResponse(res, response);
        } catch (error) {
          res.statusCode = 500;
          res.end(error instanceof Error ? error.message : "Request failed");
        }
      });

      server.listen(0, "127.0.0.1");
      await once(server, "listening");

      const address = server.address();

      if (!address || typeof address === "string") {
        throw new Error("Test server did not bind to a TCP port");
      }

      return {
        baseUrl: `http://127.0.0.1:${address.port}/__toolbar`,
        close: async () => {
          await dispose();
          await closeServer(server);
        }
      };
    }),
    ({ baseUrl }) => run(baseUrl),
    ({ close }) => Effect.promise(close)
  );
}

async function writeResponse(res: ServerResponse, response: Response) {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  res.end(Buffer.from(await response.arrayBuffer()));
}

async function closeServer(server: Server) {
  if (!server.listening) return;

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

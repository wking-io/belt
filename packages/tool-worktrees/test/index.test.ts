import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Context, Effect, Layer } from "effect";
import { HttpRouter, HttpServer } from "effect/unstable/http";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import {
  GitWorktreeParseError,
  WorktreeResolverError,
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
        const tool = worktreesTool({
          cwd,
          resolver: {
            resolve: () => []
          }
        });
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
});

function requestToolIndex(tool: ReturnType<typeof worktreesTool>) {
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

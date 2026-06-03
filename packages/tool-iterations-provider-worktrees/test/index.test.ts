import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import {
  GitWorktreeParseError,
  WorktreeResolverError,
  parseGitWorktreeList,
  toWorktreeIterations,
} from "../src/index.ts";

describe("parseGitWorktreeList", () => {
  it.effect("parses git worktree porcelain output", () =>
    Effect.gen(function* () {
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
          path: "/repo/myapp",
        },
        {
          branch: "fix-ui",
          detached: false,
          path: "/repo/myapp-fix-ui",
        },
      ]);
    }),
  );

  it.effect("fails with a typed parse error when a block has no worktree path", () =>
    Effect.gen(function* () {
      const error = yield* parseGitWorktreeList(`HEAD 4444444444444444444444444444444444444444
branch refs/heads/main
`).pipe(Effect.flip);

      assert.ok(error instanceof GitWorktreeParseError);
      assert.strictEqual(error._tag, "GitWorktreeParseError");
    }),
  );
});

describe("toWorktreeIterations", () => {
  it.effect("maps worktrees into Iteration records with Git metadata", () =>
    Effect.gen(function* () {
      const iterations = yield* toWorktreeIterations({
        currentPath: "/repo/myapp",
        resolvePath: (...segments) => segments.join("/"),
        resolver: {
          resolve: (worktree) => [
            {
              id: "web",
              label: "Web",
              primary: true,
              url: `https://${worktree.branch}.myapp.localhost`,
            },
          ],
        },
        worktrees: [
          { branch: "main", detached: false, path: "/repo/myapp" },
          { branch: "fix-ui", detached: false, path: "/repo/myapp-fix-ui" },
        ],
      });

      assert.deepStrictEqual(
        iterations.map((iteration) => ({
          id: iteration.id,
          label: iteration.label,
          kind: iteration.kind,
          current: iteration.current,
          metadata: iteration.metadata,
        })),
        [
          {
            id: "worktree:main",
            label: "main",
            kind: "worktree",
            current: true,
            metadata: {
              branch: "main",
              detached: false,
              path: "/repo/myapp",
            },
          },
          {
            id: "worktree:fix-ui",
            label: "fix-ui",
            kind: "worktree",
            current: false,
            metadata: {
              branch: "fix-ui",
              detached: false,
              path: "/repo/myapp-fix-ui",
            },
          },
        ],
      );
    }),
  );

  it.effect("surfaces resolver failures as typed errors", () =>
    Effect.gen(function* () {
      const error = yield* toWorktreeIterations({
        currentPath: "/repo/myapp",
        resolvePath: (...segments) => segments.join("/"),
        resolver: {
          resolve: () => Effect.fail("resolver exploded"),
        },
        worktrees: [{ branch: "main", detached: false, path: "/repo/myapp" }],
      }).pipe(Effect.flip);

      assert.ok(error instanceof WorktreeResolverError);
      assert.strictEqual(error._tag, "WorktreeResolverError");
    }),
  );
});

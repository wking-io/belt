import { NodeServices } from "@effect/platform-node";
import { defineTool, type ToolDefinition } from "@repo/core";
import { Context, Effect, Layer, Path, Schema } from "effect";
import { ChildProcess } from "effect/unstable/process";
import { ChildProcessSpawner } from "effect/unstable/process/ChildProcessSpawner";

export type WorktreeDestination = {
  id: string;
  label: string;
  url: string;
  primary?: boolean;
  reachable?: boolean;
};

export type WorktreeEntry = {
  id: string;
  branch: string;
  path: string;
  current: boolean;
  destinations: readonly WorktreeDestination[];
};

export type DiscoveredWorktree = {
  branch: string;
  path: string;
  detached: boolean;
};

export type WorktreeUrlResolver = {
  resolve:
    (worktree: DiscoveredWorktree) =>
      | Effect.Effect<readonly WorktreeDestination[], unknown>
      | Promise<readonly WorktreeDestination[]>
      | readonly WorktreeDestination[];
};

export type WorktreesToolOptions = {
  resolver: WorktreeUrlResolver;
  cwd?: string;
};

export class GitWorktreeCommandError extends Schema.TaggedErrorClass<GitWorktreeCommandError>()(
  "GitWorktreeCommandError",
  {
    cwd: Schema.String,
    command: Schema.String,
    cause: Schema.Unknown
  }
) {}

export class NoGitRepositoryError extends Schema.TaggedErrorClass<NoGitRepositoryError>()(
  "NoGitRepositoryError",
  {
    cwd: Schema.String,
    cause: Schema.Unknown
  }
) {}

export class GitWorktreeParseError extends Schema.TaggedErrorClass<GitWorktreeParseError>()(
  "GitWorktreeParseError",
  {
    message: Schema.String,
    block: Schema.String
  }
) {}

export class WorktreeResolverError extends Schema.TaggedErrorClass<WorktreeResolverError>()(
  "WorktreeResolverError",
  {
    branch: Schema.String,
    path: Schema.String,
    cause: Schema.Unknown
  }
) {}

export type WorktreeDiscoveryError =
  | GitWorktreeCommandError
  | NoGitRepositoryError
  | GitWorktreeParseError
  | WorktreeResolverError;

export type WorktreeDiscoveryOptions = {
  cwd?: string;
  resolver: WorktreeUrlResolver;
};

export type WorktreeDiscoveryShape = {
  readonly discover: (
    cwd?: string
  ) => Effect.Effect<readonly DiscoveredWorktree[], WorktreeDiscoveryError, ChildProcessSpawner>;
  readonly list: (
    options: WorktreeDiscoveryOptions
  ) => Effect.Effect<readonly WorktreeEntry[], WorktreeDiscoveryError, ChildProcessSpawner | Path.Path>;
};

export class WorktreeDiscovery extends Context.Service<WorktreeDiscovery, WorktreeDiscoveryShape>()(
  "@repo/tool-worktrees/WorktreeDiscovery"
) {
  static readonly layer = Layer.succeed(
    WorktreeDiscovery,
    WorktreeDiscovery.of({
      discover: Effect.fn("WorktreeDiscovery.discover")(function*(cwd: string = process.cwd()) {
        const childProcess = yield* ChildProcessSpawner;
        const args = ["worktree", "list", "--porcelain"] as const;
        const output = yield* childProcess.string(
          ChildProcess.make("git", args, {
            cwd,
            stderr: "pipe"
          })
        ).pipe(
          Effect.mapError((cause) => mapGitCommandError(cwd, `git ${args.join(" ")}`, cause))
        );

        return yield* parseGitWorktreeList(output);
      }),
      list: Effect.fn("WorktreeDiscovery.list")(function*(options: WorktreeDiscoveryOptions) {
        const childProcess = yield* ChildProcessSpawner;
        const path = yield* Path.Path;
        const cwd = options.cwd ?? process.cwd();
        const currentPathArgs = ["rev-parse", "--show-toplevel"] as const;
        const currentPathOutput = yield* childProcess.string(
          ChildProcess.make("git", currentPathArgs, {
            cwd,
            stderr: "pipe"
          })
        ).pipe(
          Effect.mapError((cause) => mapGitCommandError(cwd, `git ${currentPathArgs.join(" ")}`, cause))
        );
        const worktreeListArgs = ["worktree", "list", "--porcelain"] as const;
        const worktreeListOutput = yield* childProcess.string(
          ChildProcess.make("git", worktreeListArgs, {
            cwd,
            stderr: "pipe"
          })
        ).pipe(
          Effect.mapError((cause) => mapGitCommandError(cwd, `git ${worktreeListArgs.join(" ")}`, cause))
        );
        const currentPath = path.resolve(cwd, currentPathOutput.trim());
        const worktrees = yield* parseGitWorktreeList(worktreeListOutput);

        return yield* toWorktreeEntries({
          currentPath,
          resolvePath: path.resolve,
          resolver: options.resolver,
          worktrees
        });
      })
    })
  );
}

export const WorktreeDiscoveryLive = Layer.mergeAll(WorktreeDiscovery.layer, NodeServices.layer);

export function worktreesTool(options: WorktreesToolOptions): ToolDefinition {
  return defineTool({
    id: "worktrees",
    label: "Worktrees",
    routes: {
      index: () =>
        Effect.gen(function*() {
          const discovery = yield* WorktreeDiscovery;
          const worktrees = yield* discovery.list(options).pipe(
            Effect.catchTag("NoGitRepositoryError", () => Effect.succeed([]))
          );

          return { worktrees };
        }).pipe(Effect.provide(WorktreeDiscoveryLive))
    }
  });
}

export function createWorktreesClient(options?: { basePath?: string }) {
  const basePath = options?.basePath ?? "/__toolbar/tools/worktrees";

  return {
    async list(): Promise<{ worktrees: WorktreeEntry[] }> {
      const response = await fetch(basePath);

      if (!response.ok) {
        throw new Error(`Failed to load worktrees: ${response.status}`);
      }

      return response.json() as Promise<{ worktrees: WorktreeEntry[] }>;
    }
  };
}

export const parseGitWorktreeList = Effect.fn("parseGitWorktreeList")(function*(output: string) {
  const blocks = output.trim().split("\n\n").filter(Boolean);
  const worktrees: DiscoveredWorktree[] = [];

  for (const block of blocks) {
    const lines = block.split("\n");
    const worktreePath = getPorcelainValue(lines, "worktree");

    if (!worktreePath) {
      return yield* new GitWorktreeParseError({
        message: "Git worktree porcelain block is missing a worktree path",
        block
      });
    }

    const branch = getPorcelainValue(lines, "branch");
    const detached = lines.includes("detached");

    worktrees.push({
      branch: branch ? branch.replace(/^refs\/heads\//, "") : "detached",
      detached,
      path: worktreePath
    });
  }

  return worktrees;
});

export const toWorktreeEntries = Effect.fn("toWorktreeEntries")(function*(options: {
  readonly currentPath: string;
  readonly resolvePath: (...segments: readonly string[]) => string;
  readonly resolver: WorktreeUrlResolver;
  readonly worktrees: readonly DiscoveredWorktree[];
}) {
  const currentPath = options.resolvePath(options.currentPath);

  return yield* Effect.forEach(options.worktrees, Effect.fn(function*(worktree) {
    const destinations = yield* resolveDestinations(options.resolver, worktree);

    return {
      id: slugify(worktree.branch),
      branch: worktree.branch,
      path: worktree.path,
      current: options.resolvePath(worktree.path) === currentPath,
      destinations
    };
  }));
});

const resolveDestinations = Effect.fn("resolveDestinations")(function*(
  resolver: WorktreeUrlResolver,
  worktree: DiscoveredWorktree
) {
  const result = resolver.resolve(worktree);

  if (Effect.isEffect(result)) {
    return yield* result.pipe(
      Effect.mapError((cause) => new WorktreeResolverError({
        branch: worktree.branch,
        path: worktree.path,
        cause
      }))
    );
  }

  if (isPromiseLike(result)) {
    return yield* Effect.tryPromise({
      try: () => result,
      catch: (cause) => new WorktreeResolverError({
        branch: worktree.branch,
        path: worktree.path,
        cause
      })
    });
  }

  return result;
});

function getPorcelainValue(lines: readonly string[], key: string): string | undefined {
  return lines.find((line) => line.startsWith(`${key} `))?.slice(key.length + 1);
}

function mapGitCommandError(cwd: string, command: string, cause: unknown): GitWorktreeCommandError | NoGitRepositoryError {
  const message = String(cause);

  if (message.includes("not a git repository")) {
    return new NoGitRepositoryError({ cwd, cause });
  }

  return new GitWorktreeCommandError({ cwd, command, cause });
}

function isPromiseLike(value: unknown): value is Promise<readonly WorktreeDestination[]> {
  return !!value && typeof value === "object" && "then" in value && typeof value.then === "function";
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

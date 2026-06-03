import { NodeServices } from "@effect/platform-node";
import { Context, Effect, Layer, Path, Schema } from "effect";
import { ChildProcess } from "effect/unstable/process";
import { ChildProcessSpawner } from "effect/unstable/process/ChildProcessSpawner";
import {
  IterationProviderError,
  defineIterationProvider,
  type Iteration,
  type IterationDestination,
  type IterationProvider
} from "@repo/tool-iterations";

export type DiscoveredWorktree = {
  branch: string;
  path: string;
  detached: boolean;
};

export type WorktreeDestinationResolver = {
  resolve:
    (worktree: DiscoveredWorktree) =>
      | Effect.Effect<readonly IterationDestination[], unknown>
      | Promise<readonly IterationDestination[]>
      | readonly IterationDestination[];
};

export type WorktreeIterationsOptions = {
  resolver: WorktreeDestinationResolver;
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

export type WorktreeDiscoveryShape = {
  readonly discover: (
    cwd?: string
  ) => Effect.Effect<readonly DiscoveredWorktree[], WorktreeDiscoveryError, ChildProcessSpawner>;
  readonly list: (
    options: WorktreeIterationsOptions
  ) => Effect.Effect<readonly Iteration[], WorktreeDiscoveryError, ChildProcessSpawner | Path.Path>;
};

export class WorktreeDiscovery extends Context.Service<WorktreeDiscovery, WorktreeDiscoveryShape>()(
  "@repo/tool-iterations-provider-worktrees/WorktreeDiscovery"
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
      list: Effect.fn("WorktreeDiscovery.list")(function*(options: WorktreeIterationsOptions) {
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

        return yield* toWorktreeIterations({
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

export function worktreeIterations(options: WorktreeIterationsOptions): IterationProvider {
  return defineIterationProvider({
    id: "worktrees",
    label: "Git worktrees",
    list: () =>
      Effect.gen(function*() {
        const discovery = yield* WorktreeDiscovery;

        return yield* discovery.list(options).pipe(
          Effect.catchTag("NoGitRepositoryError", () => Effect.succeed([])),
          Effect.mapError((cause) => new IterationProviderError({
            providerId: "worktrees",
            cause
          }))
        );
      }).pipe(Effect.provide(WorktreeDiscoveryLive))
  });
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

export const toWorktreeIterations = Effect.fn("toWorktreeIterations")(function*(options: {
  readonly currentPath: string;
  readonly resolvePath: (...segments: readonly string[]) => string;
  readonly resolver: WorktreeDestinationResolver;
  readonly worktrees: readonly DiscoveredWorktree[];
}) {
  const currentPath = options.resolvePath(options.currentPath);

  return yield* Effect.forEach(
    options.worktrees,
    Effect.fn("toWorktreeIterations.entry")(function*(worktree) {
      const destinations = yield* resolveDestinations(options.resolver, worktree);

      return {
        id: `worktree:${slugify(worktree.branch)}`,
        label: worktree.branch,
        kind: "worktree",
        current: options.resolvePath(worktree.path) === currentPath,
        destinations,
        metadata: {
          branch: worktree.branch,
          detached: worktree.detached,
          path: worktree.path
        }
      } satisfies Iteration;
    })
  );
});

const resolveDestinations = Effect.fn("resolveWorktreeDestinations")(function*(
  resolver: WorktreeDestinationResolver,
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

function isPromiseLike(value: unknown): value is Promise<readonly IterationDestination[]> {
  return !!value && typeof value === "object" && "then" in value && typeof value.then === "function";
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

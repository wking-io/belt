import { defineTool, makeToolbarClient, normalizeRoute, type ToolDefinition } from "@repo/core";
import { Context, Effect, Layer, Schema } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import { HttpApi, HttpApiEndpoint, HttpApiGroup, OpenApi } from "effect/unstable/httpapi";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import {
  GitWorktreeCommandError,
  GitWorktreeParseError,
  NoGitRepositoryError,
  WorktreeDiscovery as IterationWorktreeDiscovery,
  WorktreeDiscoveryLive as IterationWorktreeDiscoveryLive,
  WorktreeResolverError,
  parseGitWorktreeList,
  toWorktreeIterations,
  type DiscoveredWorktree,
  type WorktreeDestinationResolver,
  type WorktreeDiscoveryError,
  type WorktreeIterationsOptions
} from "@repo/tool-iterations-provider-worktrees";
import type { Iteration } from "@repo/tool-iterations";

export {
  GitWorktreeCommandError,
  GitWorktreeParseError,
  NoGitRepositoryError,
  WorktreeResolverError,
  parseGitWorktreeList
};
export type { DiscoveredWorktree, WorktreeDiscoveryError };

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

export type WorktreeUrlResolver = WorktreeDestinationResolver;

export type WorktreesToolOptions = WorktreeIterationsOptions;

export type WorktreeDiscoveryOptions = WorktreeIterationsOptions;

export type WorktreeDiscoveryShape = {
  readonly discover: (
    cwd?: string
  ) => Effect.Effect<readonly DiscoveredWorktree[], WorktreeDiscoveryError, unknown>;
  readonly list: (
    options: WorktreeDiscoveryOptions
  ) => Effect.Effect<readonly WorktreeEntry[], WorktreeDiscoveryError, unknown>;
};

export const WorktreeDestinationSchema = Schema.Struct({
  id: Schema.String,
  label: Schema.String,
  url: Schema.String,
  primary: Schema.optionalKey(Schema.Boolean),
  reachable: Schema.optionalKey(Schema.Boolean)
});

export const WorktreeEntrySchema = Schema.Struct({
  id: Schema.String,
  branch: Schema.String,
  path: Schema.String,
  current: Schema.Boolean,
  destinations: Schema.Array(WorktreeDestinationSchema)
});

export const WorktreesIndexResponseSchema = Schema.Struct({
  worktrees: Schema.Array(WorktreeEntrySchema)
});
export type WorktreesIndexResponse = Schema.Schema.Type<typeof WorktreesIndexResponseSchema>;

export class WorktreeDiscovery extends Context.Service<WorktreeDiscovery, WorktreeDiscoveryShape>()(
  "@repo/tool-worktrees/WorktreeDiscovery"
) {
  static readonly layer = Layer.succeed(
    WorktreeDiscovery,
    WorktreeDiscovery.of({
      discover: Effect.fn("WorktreeDiscovery.discover")(function*(cwd?: string) {
        const discovery = yield* IterationWorktreeDiscovery;

        return yield* discovery.discover(cwd);
      }),
      list: Effect.fn("WorktreeDiscovery.list")(function*(options: WorktreeDiscoveryOptions) {
        const discovery = yield* IterationWorktreeDiscovery;
        const iterations = yield* discovery.list(options);

        return iterations.map(toWorktreeEntry);
      })
    })
  );
}

export const WorktreeDiscoveryLive = Layer.mergeAll(
  WorktreeDiscovery.layer,
  IterationWorktreeDiscoveryLive
);

export class WorktreesToolApiGroup extends HttpApiGroup.make("worktrees")
  .add(
    HttpApiEndpoint.get("index", normalizeRoute("index"), {
      success: WorktreesIndexResponseSchema
    })
  )
  .annotateMerge(OpenApi.annotations({
    title: "Worktrees"
  }))
{}

export class WorktreesToolApi extends HttpApi.make("worktrees-tool-api")
  .add(WorktreesToolApiGroup)
  .annotateMerge(OpenApi.annotations({
    title: "Belt Worktrees Tool API"
  }))
{}

export const worktreesToolId = "worktrees";
export type WorktreesToolClientOptions = {
  readonly baseUrl?: string | URL;
};

export type WorktreesToolDefinition = ToolDefinition<
  typeof WorktreesToolApi,
  ReturnType<typeof worktreesToolApiLayer>,
  typeof WorktreeDiscoveryLive
>;

export function worktreesTool(options: WorktreesToolOptions): WorktreesToolDefinition {
  return defineTool({
    api: WorktreesToolApi,
    apiLayer: worktreesToolApiLayer(options),
    id: worktreesToolId,
    label: "Worktrees",
    runtimeLayer: WorktreeDiscoveryLive
  });
}

export function worktreesToolApiLayer(options: WorktreesToolOptions) {
  return HttpApiBuilder.group(
    WorktreesToolApi,
    "worktrees",
    Effect.fn("WorktreesToolApi.handlers")(function*(handlers) {
      const discovery = yield* WorktreeDiscovery;

      return handlers.handle("index", () =>
        Effect.gen(function*() {
          const worktrees = yield* discovery.list(options).pipe(
            Effect.catchTag("NoGitRepositoryError", () => Effect.succeed([]))
          );

          return { worktrees };
        }).pipe(
          Effect.orDie
        ));
    })
  );
}

export function makeWorktreesToolClient(options?: WorktreesToolClientOptions) {
  return Effect.gen(function*() {
    const toolbar = yield* makeToolbarClient(options);

    return yield* toolbar.tool(WorktreesToolApi, worktreesToolId);
  });
}

export function createWorktreesClient(options?: WorktreesToolClientOptions) {
  return {
    list: (): Promise<WorktreesIndexResponse> =>
      makeWorktreesToolClient(options).pipe(
        Effect.flatMap((client) => client.worktrees.index()),
        Effect.provide(FetchHttpClient.layer),
        Effect.runPromise
      )
  };
}

export const toWorktreeEntries = Effect.fn("toWorktreeEntries")(function*(options: {
  readonly currentPath: string;
  readonly resolvePath: (...segments: readonly string[]) => string;
  readonly resolver: WorktreeUrlResolver;
  readonly worktrees: readonly DiscoveredWorktree[];
}) {
  const iterations = yield* toWorktreeIterations(options);

  return iterations.map(toWorktreeEntry);
});

function toWorktreeEntry(iteration: Iteration): WorktreeEntry {
  const branch = getMetadataString(iteration, "branch") ?? iteration.label;
  const path = getMetadataString(iteration, "path") ?? "";

  return {
    id: iteration.id.replace(/^worktree:/, ""),
    branch,
    path,
    current: iteration.current,
    destinations: iteration.destinations
  };
}

function getMetadataString(iteration: Iteration, key: string): string | undefined {
  const value = iteration.metadata?.[key];

  return typeof value === "string" ? value : undefined;
}

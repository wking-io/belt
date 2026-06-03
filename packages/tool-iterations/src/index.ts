import {
  defineTool,
  defineToolRegistration,
  makeToolbarClient,
  normalizeRoute,
  type ToolDefinition,
  type ToolRegistration,
} from "@repo/core";
import { Effect, Schema } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import { HttpApi, HttpApiEndpoint, HttpApiGroup, OpenApi } from "effect/unstable/httpapi";
import { HttpApiBuilder } from "effect/unstable/httpapi";

export type IterationDestination = {
  id: string;
  label: string;
  url: string;
  primary?: boolean;
  reachable?: boolean;
};

export type Iteration = {
  id: string;
  label: string;
  kind: string;
  current: boolean;
  description?: string;
  destinations: readonly IterationDestination[];
  metadata?: Record<string, unknown>;
};

export type IterationProvider = {
  id: string;
  label: string;
  list: () => Effect.Effect<readonly Iteration[], IterationProviderError>;
};

export type IterationsToolOptions = {
  providers: readonly IterationProvider[];
};

export const IterationDestinationSchema = Schema.Struct({
  id: Schema.String,
  label: Schema.String,
  url: Schema.String,
  primary: Schema.optionalKey(Schema.Boolean),
  reachable: Schema.optionalKey(Schema.Boolean),
});

export const IterationSchema = Schema.Struct({
  id: Schema.String,
  label: Schema.String,
  kind: Schema.String,
  current: Schema.Boolean,
  description: Schema.optionalKey(Schema.String),
  destinations: Schema.Array(IterationDestinationSchema),
  metadata: Schema.optionalKey(Schema.Record(Schema.String, Schema.Unknown)),
});

export const IterationsIndexResponseSchema = Schema.Struct({
  iterations: Schema.Array(IterationSchema),
});
export type IterationsIndexResponse = Schema.Schema.Type<typeof IterationsIndexResponseSchema>;

export class IterationProviderError extends Schema.TaggedErrorClass<IterationProviderError>()(
  "IterationProviderError",
  {
    providerId: Schema.String,
    cause: Schema.Unknown,
  },
) {}

export class IterationsToolApiGroup extends HttpApiGroup.make("iterations")
  .add(
    HttpApiEndpoint.get("index", normalizeRoute("index"), {
      success: IterationsIndexResponseSchema,
    }),
  )
  .annotateMerge(
    OpenApi.annotations({
      title: "Iterations",
    }),
  ) {}

export class IterationsToolApi extends HttpApi.make("iterations-tool-api")
  .add(IterationsToolApiGroup)
  .annotateMerge(
    OpenApi.annotations({
      title: "Belt Iterations Tool API",
    }),
  ) {}

export const iterationsToolId = "iterations";

export type IterationsToolClientOptions = {
  readonly baseUrl?: string | URL;
};

export type IterationsToolDefinition = ToolDefinition<
  typeof IterationsToolApi,
  ReturnType<typeof iterationsToolApiLayer>,
  undefined
>;

export type IterationsToolRegistration = ToolRegistration<unknown, IterationsToolDefinition>;

export function defineIterationProvider<const Provider extends IterationProvider>(
  provider: Provider,
): Provider {
  return provider;
}

export function iterationsTool(options: IterationsToolOptions): IterationsToolRegistration {
  return defineToolRegistration({
    tool: defineTool({
      api: IterationsToolApi,
      apiLayer: iterationsToolApiLayer(options),
      id: iterationsToolId,
      label: "Iterations",
    }),
  });
}

export function iterationsToolApiLayer(options: IterationsToolOptions) {
  return HttpApiBuilder.group(
    IterationsToolApi,
    "iterations",
    Effect.fn("IterationsToolApi.handlers")(function* (handlers) {
      return handlers.handle("index", () =>
        listIterations(options.providers).pipe(
          Effect.map((iterations) => ({ iterations })),
          Effect.orDie,
        ),
      );
    }),
  );
}

export const listIterations = Effect.fn("listIterations")(function* (
  providers: readonly IterationProvider[],
) {
  const lists = yield* Effect.forEach(
    providers,
    Effect.fn("listIterations.provider")(function* (provider) {
      return yield* provider
        .list()
        .pipe(
          Effect.mapError((cause) =>
            cause instanceof IterationProviderError
              ? cause
              : new IterationProviderError({ providerId: provider.id, cause }),
          ),
        );
    }),
  );

  return lists.flat();
});

export function makeIterationsToolClient(options?: IterationsToolClientOptions) {
  return Effect.gen(function* () {
    const toolbar = yield* makeToolbarClient(options);

    return yield* toolbar.tool(IterationsToolApi, iterationsToolId);
  });
}

export function createIterationsClient(options?: IterationsToolClientOptions) {
  return {
    list: (): Promise<IterationsIndexResponse> =>
      makeIterationsToolClient(options).pipe(
        Effect.flatMap((client) => client.iterations.index()),
        Effect.provide(FetchHttpClient.layer),
        Effect.runPromise,
      ),
  };
}

import { NodeFileSystem, NodePath } from "@effect/platform-node";
import { NonEmptyStringSchema } from "@repo/core";
import {
  IterationProviderError,
  defineIterationProvider,
  type Iteration,
  type IterationProvider,
} from "@repo/tool-iterations";
import { Effect, FileSystem, Path, Schema } from "effect";

export const PrototypeIterationsOptionsSchema = Schema.Struct({
  root: Schema.optionalKey(NonEmptyStringSchema),
  prototypesDir: Schema.optionalKey(NonEmptyStringSchema),
  routePrefix: Schema.optionalKey(NonEmptyStringSchema),
  destinationId: Schema.optionalKey(NonEmptyStringSchema),
  destinationLabel: Schema.optionalKey(NonEmptyStringSchema),
  includeDefault: Schema.optionalKey(Schema.Boolean),
});

export type PrototypeIterationsOptions = Schema.Schema.Type<
  typeof PrototypeIterationsOptionsSchema
>;

export type PrototypeMetadataRecord = {
  name: string;
  isDefault: boolean;
  routePath: string;
  sourceDir: string | null;
};

export type PrototypeMetadata = {
  prototypes: readonly PrototypeMetadataRecord[];
  routePrefix: string;
  defaultPrototype: string | null;
};

export class PrototypeDiscoveryError extends Schema.TaggedErrorClass<PrototypeDiscoveryError>()(
  "PrototypeDiscoveryError",
  {
    prototypesDir: Schema.String,
    cause: Schema.Unknown,
  },
) {}

export function prototypeIterations(options: PrototypeIterationsOptions = {}): IterationProvider {
  const config = Schema.decodeUnknownSync(PrototypeIterationsOptionsSchema)(options);

  return defineIterationProvider({
    id: "prototypes",
    label: "Prototype overlays",
    list: () =>
      listPrototypeIterations(config).pipe(
        Effect.mapError(
          (cause) =>
            new IterationProviderError({
              providerId: "prototypes",
              cause,
            }),
        ),
        Effect.provide(NodeFileSystem.layer),
        Effect.provide(NodePath.layer),
      ),
  });
}

export const getPrototypeMetadata = Effect.fn("getPrototypeMetadata")(function* (
  options: PrototypeIterationsOptions = {},
) {
  const config = Schema.decodeUnknownSync(PrototypeIterationsOptionsSchema)(options);
  const path = yield* Path.Path;
  const root = path.resolve(config.root ?? process.cwd());
  const prototypesDir = path.resolve(root, config.prototypesDir ?? "prototypes");
  const routePrefix = normalizeRoutePrefix(config.routePrefix ?? "/__prototype/");
  const prototypes = yield* discoverPrototypes({
    prototypesDir,
    includeDefault: config.includeDefault ?? true,
  });
  const records = prototypes.map(
    (name): PrototypeMetadataRecord => ({
      name,
      isDefault: name === "default",
      routePath: joinPublicPath(routePrefix, name),
      sourceDir: name === "default" ? null : path.join(prototypesDir, name),
    }),
  );

  return {
    prototypes: records,
    routePrefix,
    defaultPrototype: records.find((prototype) => prototype.isDefault)?.name ?? null,
  };
});

export const listPrototypeIterations = Effect.fn("listPrototypeIterations")(function* (
  options: PrototypeIterationsOptions = {},
) {
  const metadata = yield* getPrototypeMetadata(options);
  const destinationId = options.destinationId ?? "preview";
  const destinationLabel = options.destinationLabel ?? "Preview";

  return metadata.prototypes.map(
    (prototype): Iteration => ({
      id: `prototype:${prototype.name}`,
      label: prototype.name,
      kind: "prototype",
      current: false,
      destinations: [
        {
          id: destinationId,
          label: destinationLabel,
          primary: true,
          url: prototype.routePath,
        },
      ],
      metadata: {
        isDefault: prototype.isDefault,
        routePath: prototype.routePath,
        sourceDir: prototype.sourceDir,
      },
    }),
  );
});

export const discoverPrototypes = Effect.fn("discoverPrototypes")(function* (options: {
  prototypesDir: string;
  includeDefault: boolean;
}) {
  const fileSystem = yield* FileSystem.FileSystem;
  const prototypes = options.includeDefault ? ["default"] : [];
  const exists = yield* fileSystem
    .exists(options.prototypesDir)
    .pipe(Effect.catch(() => Effect.succeed(false)));

  if (!exists) {
    return prototypes;
  }

  const entries = yield* fileSystem.readDirectory(options.prototypesDir).pipe(
    Effect.mapError(
      (cause) =>
        new PrototypeDiscoveryError({
          prototypesDir: options.prototypesDir,
          cause,
        }),
    ),
  );

  for (const entry of entries) {
    const entryPath = `${options.prototypesDir}/${entry}`;
    const fileInfo = yield* fileSystem.stat(entryPath).pipe(
      Effect.map((info) => info as { readonly type?: string }),
      Effect.mapError(
        (cause) =>
          new PrototypeDiscoveryError({
            prototypesDir: options.prototypesDir,
            cause,
          }),
      ),
    );

    if (fileInfo.type === "Directory" && entry !== "default") {
      prototypes.push(entry);
    }
  }

  return prototypes.sort((a, b) => {
    if (a === "default") return -1;
    if (b === "default") return 1;
    return a.localeCompare(b);
  });
});

function normalizeRoutePrefix(value: string): string {
  const prefix = `/${value.replace(/^\/+|\/+$/g, "")}/`;

  return prefix === "//" ? "/__prototype/" : prefix;
}

function joinPublicPath(...parts: readonly string[]): string {
  const joined = parts
    .map((part) => part.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");

  return `/${joined}`;
}

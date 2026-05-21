import { NodeFileSystem, NodePath } from "@effect/platform-node";
import { IdGenerator, NonEmptyStringSchema } from "@repo/core";
import { Context, Effect, FileSystem, Layer, Path, Schema } from "effect";
import type { ControlPanelConfig } from "../config/index.js";
import {
  ControlSnapshotStoreParseError,
  ControlSnapshotStoreReadError,
  ControlSnapshotStoreWriteError,
  DuplicateControlSnapshotIdError,
  DuplicateControlSnapshotNameError,
  UnknownControlFieldsetError,
  type ControlSnapshotPersistenceError,
  type ControlSnapshotStoreError
} from "../errors.js";
import {
  isCompatibleControlFieldValue,
  type ControlFieldsetValueMap,
  type ControlSnapshotValueMap
} from "../config/fields.js";
import {
  pickKnownFieldValues,
  type ControlSnapshot
} from "../state/index.js";

export type SnapshotStoreWriteOptions = {
  readonly name: string;
  readonly values: ControlFieldsetValueMap;
};

export type ControlSnapshotFileSystemPersistenceOptions = {
  readonly cwd?: string;
};

export type ControlSnapshotStoreData = {
  readonly version: 1;
  readonly snapshots: readonly ControlSnapshot[];
};

export type ControlSnapshotPersistenceShape = {
  readonly load: () => Effect.Effect<unknown, ControlSnapshotPersistenceError, never>;
  readonly save: (data: ControlSnapshotStoreData) => Effect.Effect<void, ControlSnapshotPersistenceError, never>;
};

export type ControlSnapshotStoreShape = {
  readonly read: (
    config: ControlPanelConfig
  ) => Effect.Effect<ControlSnapshotStoreData, ControlSnapshotStoreError>;
  readonly write: (
    config: ControlPanelConfig,
    data: ControlSnapshotStoreData
  ) => Effect.Effect<ControlSnapshotStoreData, ControlSnapshotStoreError>;
  readonly create: (
    config: ControlPanelConfig,
    fieldsetId: string,
    snapshot: SnapshotStoreWriteOptions
  ) => Effect.Effect<ControlSnapshot, ControlSnapshotStoreError>;
};

export const ControlSnapshotSchema = Schema.Struct({
  id: NonEmptyStringSchema,
  name: NonEmptyStringSchema,
  fieldsetId: NonEmptyStringSchema,
  values: Schema.Record(Schema.String, Schema.Unknown)
});

export const ControlSnapshotStoreDataSchema = Schema.Struct({
  version: Schema.Literal(1),
  snapshots: Schema.Array(ControlSnapshotSchema)
});

export const controlSnapshotStoreDirectory = ".toolbar/control-panel";
export const controlSnapshotStoreFilename = "snapshots.json";
export const controlSnapshotStoreGitignoreEntry = ".toolbar/";

export class ControlSnapshotPersistence extends Context.Service<
  ControlSnapshotPersistence,
  ControlSnapshotPersistenceShape
>()("@repo/control-panel-core/ControlSnapshotPersistence") {}

export class ControlSnapshotStore extends Context.Service<ControlSnapshotStore, ControlSnapshotStoreShape>()(
  "@repo/control-panel-core/ControlSnapshotStore"
) {
  static readonly layer = Layer.effect(
    ControlSnapshotStore,
    Effect.gen(function*() {
      const ids = yield* IdGenerator;
      const persistence = yield* ControlSnapshotPersistence;

      return ControlSnapshotStore.of({
        read: Effect.fn("ControlSnapshotStore.read")(function*(config) {
          const persisted = yield* persistence.load();
          const decoded = yield* decodeSnapshotStoreDataEffect("ControlSnapshotPersistence.load", persisted);

          return yield* validateSnapshotStoreDataEffect("ControlSnapshotStore.read", config, decoded);
        }),
        write: Effect.fn("ControlSnapshotStore.write")(function*(config, data) {
          const validated = yield* validateSnapshotStoreDataEffect("ControlSnapshotStore.write", config, data);
          yield* persistence.save(validated);

          return validated;
        }),
        create: Effect.fn("ControlSnapshotStore.create")(function*(config, fieldsetId, snapshot) {
          const id = yield* ids.next("snapshot");
          const persisted = yield* persistence.load();
          const decoded = yield* decodeSnapshotStoreDataEffect("ControlSnapshotPersistence.load", persisted);
          const current = yield* validateSnapshotStoreDataEffect("ControlSnapshotStore.create", config, decoded);

          const snapshotValues = yield* Effect.try({
            try: () => pickKnownFieldValues(config, fieldsetId, snapshot.values),
            catch: (cause) => mapSnapshotStoreValidationError("ControlSnapshotStore.create", cause)
          });
          const nextSnapshot: ControlSnapshot = {
            id,
            name: snapshot.name,
            fieldsetId,
            values: snapshotValues
          };

          const next = yield* validateSnapshotStoreDataEffect("ControlSnapshotStore.create", config, {
            version: 1,
            snapshots: [...current.snapshots, nextSnapshot]
          });
          yield* persistence.save(next);

          return nextSnapshot;
        })
      });
    })
  );
}

export function controlSnapshotFileSystemPersistenceLayer(
  options: ControlSnapshotFileSystemPersistenceOptions = {}
) {
  return Layer.effect(
    ControlSnapshotPersistence,
    Effect.gen(function*() {
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const cwd = options.cwd ?? process.cwd();

      return ControlSnapshotPersistence.of({
        load: Effect.fn("ControlSnapshotPersistence.load")(function*() {
          const storePath = path.resolve(cwd, controlSnapshotStoreDirectory, controlSnapshotStoreFilename);
          const exists = yield* fs.exists(storePath).pipe(Effect.catch(() => Effect.succeed(false)));

          if (!exists) {
            return emptyControlSnapshotStore();
          }

          const raw = yield* fs.readFileString(storePath).pipe(
            Effect.mapError((cause) => new ControlSnapshotStoreReadError({ path: storePath, cause }))
          );

          return yield* Effect.try({
            try: () => JSON.parse(raw),
            catch: (cause) => new ControlSnapshotStoreParseError({ path: storePath, cause })
          });
        }),
        save: Effect.fn("ControlSnapshotPersistence.save")(function*(data) {
          const storePath = path.resolve(cwd, controlSnapshotStoreDirectory, controlSnapshotStoreFilename);
          const storeDirectory = path.dirname(storePath);
          const gitignorePath = path.resolve(cwd, ".gitignore");

          yield* fs.makeDirectory(storeDirectory, { recursive: true }).pipe(
            Effect.mapError((cause) => new ControlSnapshotStoreWriteError({ path: storeDirectory, cause }))
          );

          const gitignoreExists = yield* fs.exists(gitignorePath).pipe(Effect.catch(() => Effect.succeed(false)));
          const currentGitignore = gitignoreExists ? yield* fs.readFileString(gitignorePath).pipe(
            Effect.mapError((cause) => new ControlSnapshotStoreReadError({ path: gitignorePath, cause }))
          ) : "";
          const gitignoreEntries = currentGitignore.split(/\r?\n/);

          if (!gitignoreEntries.includes(controlSnapshotStoreGitignoreEntry)) {
            const prefix = currentGitignore.length === 0 || currentGitignore.endsWith("\n") ? currentGitignore : `${currentGitignore}\n`;
            yield* fs.writeFileString(gitignorePath, `${prefix}${controlSnapshotStoreGitignoreEntry}\n`).pipe(
              Effect.mapError((cause) => new ControlSnapshotStoreWriteError({ path: gitignorePath, cause }))
            );
          }

          yield* fs.writeFileString(storePath, `${JSON.stringify(data, null, 2)}\n`).pipe(
            Effect.mapError((cause) => new ControlSnapshotStoreWriteError({ path: storePath, cause }))
          );
        })
      });
    })
  );
}

export const ControlSnapshotFileSystemPersistenceLive = controlSnapshotFileSystemPersistenceLayer();

export const ControlSnapshotStoreLive = Layer.provide(
  ControlSnapshotStore.layer,
  Layer.mergeAll(
    Layer.provide(ControlSnapshotFileSystemPersistenceLive, Layer.mergeAll(NodeFileSystem.layer, NodePath.layer)),
    IdGenerator.layer
  )
);

function emptyControlSnapshotStore(): ControlSnapshotStoreData {
  return {
    version: 1,
    snapshots: []
  };
}

function validateSnapshotStoreData(
  config: ControlPanelConfig,
  data: ControlSnapshotStoreData
): ControlSnapshotStoreData {
  const snapshots = data.snapshots.map((snapshot) => validateStoredSnapshot(config, snapshot));
  assertUniqueStoredSnapshots(snapshots);

  return {
    version: 1,
    snapshots
  };
}

function validateSnapshotStoreDataEffect(
  source: string,
  config: ControlPanelConfig,
  data: ControlSnapshotStoreData
) {
  return Effect.try({
    try: () => validateSnapshotStoreData(config, data),
    catch: (cause) => mapSnapshotStoreValidationError(source, cause)
  });
}

function decodeSnapshotStoreDataEffect(source: string, data: unknown) {
  return Schema.decodeUnknownEffect(ControlSnapshotStoreDataSchema)(data).pipe(
    Effect.mapError((cause) => new ControlSnapshotStoreParseError({ path: source, cause }))
  );
}

function mapSnapshotStoreValidationError(source: string, cause: unknown): ControlSnapshotStoreError {
  if (
    cause instanceof UnknownControlFieldsetError ||
    cause instanceof DuplicateControlSnapshotIdError ||
    cause instanceof DuplicateControlSnapshotNameError
  ) {
    return cause;
  }

  return new ControlSnapshotStoreParseError({ path: source, cause });
}

function validateStoredSnapshot(config: ControlPanelConfig, snapshot: ControlSnapshot): ControlSnapshot {
  if (!config.fieldsets[snapshot.fieldsetId]) {
    return snapshot;
  }

  return {
    ...snapshot,
    values: sanitizeSnapshotValues(config, snapshot.fieldsetId, snapshot.values)
  };
}

function sanitizeSnapshotValues(
  config: ControlPanelConfig,
  fieldsetId: string,
  values: ControlSnapshotValueMap
): ControlSnapshotValueMap {
  const fieldset = config.fieldsets[fieldsetId];

  if (!fieldset) {
    throw new UnknownControlFieldsetError({ fieldsetId });
  }

  const sanitized: Record<string, unknown> = {};

  for (const [fieldId, field] of Object.entries(fieldset.fields)) {
    const value = values[fieldId];

    if (value !== undefined && isCompatibleControlFieldValue(field, value)) {
      sanitized[fieldId] = value;
    }
  }

  return sanitized;
}

function assertUniqueStoredSnapshots(snapshots: readonly ControlSnapshot[]): void {
  const ids = new Set<string>();
  const namesByFieldset = new Map<string, Set<string>>();

  for (const snapshot of snapshots) {
    if (ids.has(snapshot.id)) {
      throw new DuplicateControlSnapshotIdError({ snapshotId: snapshot.id });
    }

    ids.add(snapshot.id);

    const names = namesByFieldset.get(snapshot.fieldsetId) ?? new Set<string>();

    if (names.has(snapshot.name)) {
      throw new DuplicateControlSnapshotNameError({
        fieldsetId: snapshot.fieldsetId,
        name: snapshot.name
      });
    }

    names.add(snapshot.name);
    namesByFieldset.set(snapshot.fieldsetId, names);
  }
}

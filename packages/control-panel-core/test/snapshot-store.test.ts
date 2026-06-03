import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { NodeFileSystem, NodePath } from "@effect/platform-node";
import { assert, it } from "@effect/vitest";
import { IdGenerator } from "@repo/core";
import { Effect, Layer } from "effect";
import {
  controlField,
  ControlSnapshotPersistence,
  ControlSnapshotStore,
  type ControlSnapshotStoreData,
  controlSnapshotFileSystemPersistenceLayer,
  controlSnapshotStoreGitignoreEntry,
  defineControlPanel,
  DuplicateControlSnapshotNameError,
} from "../src/index.ts";

it.effect("reads a missing snapshot store as an empty store", () =>
  withProject(function* (cwd) {
    const config = defineControlPanel({
      fieldsets: {
        scene: {
          fields: {
            title: controlField.text(),
          },
        },
      },
    });
    const store = yield* ControlSnapshotStore;

    assert.deepStrictEqual(yield* store.read(config), {
      version: 1,
      activeFieldsetId: "scene",
      activeBaseByFieldset: {
        scene: {
          type: "defaults",
        },
      },
      snapshots: [],
    });
  }),
);

it.effect("creates snapshots with generated ids and persists the project-local ignored store", () =>
  withProject(function* (cwd) {
    const config = defineControlPanel({
      fieldsets: {
        scene: {
          fields: {
            title: controlField.text(),
          },
        },
      },
    });
    const store = yield* ControlSnapshotStore;
    const snapshot = yield* store.create(config, "scene", {
      name: "Warm",
      values: {
        title: "Hello",
      },
    });
    const storePath = path.join(cwd, ".toolbar", "control-panel", "snapshots.json");
    const persisted = JSON.parse(yield* Effect.promise(() => readFile(storePath, "utf8")));
    const gitignore = yield* Effect.promise(() => readFile(path.join(cwd, ".gitignore"), "utf8"));

    assert.strictEqual(snapshot.id, "snapshot_test-id-1");
    assert.deepStrictEqual(persisted, {
      version: 1,
      activeFieldsetId: "scene",
      activeBaseByFieldset: {
        scene: {
          type: "snapshot",
          snapshotId: "snapshot_test-id-1",
        },
      },
      snapshots: [
        {
          id: "snapshot_test-id-1",
          name: "Warm",
          fieldsetId: "scene",
          values: {
            title: "Hello",
          },
        },
      ],
    });
    assert.strictEqual(gitignore, `${controlSnapshotStoreGitignoreEntry}\n`);
  }),
);

it.effect("enforces snapshot names unique per fieldset", () =>
  withProject(function* (cwd) {
    const config = defineControlPanel({
      fieldsets: {
        scene: {
          fields: {
            title: controlField.text(),
          },
        },
      },
    });
    const store = yield* ControlSnapshotStore;
    yield* store.create(config, "scene", {
      name: "Warm",
      values: {
        title: "A",
      },
    });
    const error = yield* Effect.catchTag(
      store.create(config, "scene", {
        name: "Warm",
        values: {
          title: "B",
        },
      }),
      "DuplicateControlSnapshotNameError",
      (caught) => Effect.succeed(caught),
    );

    assert.ok(error instanceof DuplicateControlSnapshotNameError);
  }),
);

it.effect("supports alternate persistence layers", () => {
  let persisted: unknown = {
    version: 1,
    snapshots: [],
  };

  return Effect.gen(function* () {
    const config = defineControlPanel({
      fieldsets: {
        scene: {
          fields: {
            title: controlField.text(),
          },
        },
      },
    });
    const store = yield* ControlSnapshotStore;
    const snapshot = yield* store.create(config, "scene", {
      name: "Warm",
      values: {
        title: "Hello",
      },
    });

    assert.deepStrictEqual(snapshot, {
      id: "snapshot_test-id-1",
      name: "Warm",
      fieldsetId: "scene",
      values: {
        title: "Hello",
      },
    });
    assert.deepStrictEqual(persisted, {
      version: 1,
      activeFieldsetId: "scene",
      activeBaseByFieldset: {
        scene: {
          type: "snapshot",
          snapshotId: "snapshot_test-id-1",
        },
      },
      snapshots: [snapshot],
    });
  }).pipe(
    Effect.provide(
      testStoreLayer({
        load: () => Effect.succeed(persisted),
        save: (data) =>
          Effect.sync(() => {
            persisted = data;
          }),
      }),
    ),
  );
});

it.effect(
  "sanitizes stored values against current config without deleting removed fieldset snapshots",
  () =>
    withProject(function* (cwd) {
      const config = defineControlPanel({
        fieldsets: {
          scene: {
            fields: {
              title: controlField.text(),
              enabled: controlField.boolean(),
              density: controlField.select({
                options: [
                  { label: "Compact", value: "compact" },
                  { label: "Comfortable", value: "comfortable" },
                ],
              }),
            },
          },
        },
      });
      const storePath = path.join(cwd, ".toolbar", "control-panel", "snapshots.json");
      yield* Effect.promise(() =>
        writeFile(
          storePath,
          JSON.stringify({
            version: 1,
            snapshots: [
              {
                id: "snapshot-a",
                name: "Scene A",
                fieldsetId: "scene",
                values: {
                  title: "Hello",
                  enabled: "yes",
                  density: "stale",
                  unknown: "ignored",
                },
              },
              {
                id: "snapshot-removed",
                name: "Removed",
                fieldsetId: "removed",
                values: {
                  anything: "kept",
                },
              },
            ],
          }),
        ),
      );
      const store = yield* ControlSnapshotStore;

      assert.deepStrictEqual(yield* store.read(config), {
        version: 1,
        activeFieldsetId: "scene",
        activeBaseByFieldset: {
          scene: {
            type: "defaults",
          },
        },
        snapshots: [
          {
            id: "snapshot-a",
            name: "Scene A",
            fieldsetId: "scene",
            values: {
              title: "Hello",
            },
          },
          {
            id: "snapshot-removed",
            name: "Removed",
            fieldsetId: "removed",
            values: {
              anything: "kept",
            },
          },
        ],
      });
    }),
);

function withProject<A, E, R>(
  effect: (cwd: string) => Effect.Effect<A, E, R | ControlSnapshotStore>,
): Effect.Effect<A, E, Exclude<R, ControlSnapshotStore | IdGenerator>> {
  let idIndex = 0;

  return Effect.acquireUseRelease(
    Effect.promise(() => mkdtemp(path.join(os.tmpdir(), "belt-snapshot-store-"))),
    (cwd) =>
      Effect.provide(
        Effect.gen(function* () {
          yield* Effect.promise(() => writeFile(path.join(cwd, ".gitignore"), ""));
          yield* Effect.promise(() =>
            mkdir(path.join(cwd, ".toolbar", "control-panel"), { recursive: true }),
          );
          return yield* effect(cwd);
        }),
        Layer.provide(
          ControlSnapshotStore.layer,
          Layer.mergeAll(
            Layer.provide(
              controlSnapshotFileSystemPersistenceLayer({ cwd }),
              Layer.mergeAll(NodeFileSystem.layer, NodePath.layer),
            ),
            testIdGeneratorLayer(() => {
              idIndex += 1;
              return idIndex;
            }),
          ),
        ),
      ),
    (cwd) => Effect.promise(() => rm(cwd, { force: true, recursive: true })),
  );
}

function testStoreLayer(persistence: {
  readonly load: () => Effect.Effect<unknown>;
  readonly save: (data: ControlSnapshotStoreData) => Effect.Effect<void>;
}) {
  let idIndex = 0;

  return Layer.provide(
    ControlSnapshotStore.layer,
    Layer.mergeAll(
      Layer.succeed(ControlSnapshotPersistence)({
        load: persistence.load,
        save: (data) => persistence.save(data),
      }),
      testIdGeneratorLayer(() => {
        idIndex += 1;
        return idIndex;
      }),
    ),
  );
}

function testIdGeneratorLayer(nextIndex: () => number) {
  return Layer.succeed(IdGenerator)({
    next: (prefix) => {
      const idIndex = nextIndex();
      return Effect.succeed(prefix ? `${prefix}_test-id-${idIndex}` : `test-id-${idIndex}`);
    },
  });
}

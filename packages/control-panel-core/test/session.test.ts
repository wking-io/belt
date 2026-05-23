import { assert, it } from "@effect/vitest";
import { IdGenerator } from "@repo/core";
import { Effect, Layer } from "effect";
import {
  ControlSnapshotPersistence,
  ControlSnapshotStore,
  controlField,
  defineControlPanel,
  type ControlSnapshotStoreData
} from "../src/index.ts";
import { ControlSession } from "../src/session/index.ts";

it.effect("persists active Control Session selection through the Snapshot Store", () => {
  let persisted: unknown = {
    version: 1,
    snapshots: []
  };
  const definition = testDefinition();

  return Effect.gen(function*() {
    const session = yield* ControlSession;
    const selected = yield* session.selectFieldset({ fieldsetId: "camera" });
    const state = yield* session.state;

    assert.deepStrictEqual(selected.state.activeFieldsetId, "camera");
    assert.deepStrictEqual(state.state.currentValuesByFieldset, {
      scene: {
        title: "Default"
      },
      camera: {
        zoom: 1
      }
    });
    assert.deepStrictEqual(persisted, {
      version: 1,
      activeFieldsetId: "camera",
      activeBaseByFieldset: {
        scene: { type: "defaults" },
        camera: { type: "defaults" }
      },
      snapshots: []
    });
  }).pipe(Effect.provide(controlSessionLayer(definition, {
    load: () => Effect.succeed(persisted),
    save: (data) => Effect.sync(() => {
      persisted = data;
    })
  })));
});

it.effect("branches, saves, reads, and deletes Control Snapshots through Control Session operations", () => {
  let persisted: unknown = {
    version: 1,
    snapshots: []
  };
  const definition = testDefinition();

  return Effect.gen(function*() {
    const session = yield* ControlSession;
    const branched = yield* session.branchSnapshot({
      fieldsetId: "scene",
      name: "Draft",
      values: {
        title: "Draft title"
      }
    });

    assert.deepStrictEqual(branched.snapshot, {
      id: "snapshot_test-id-1",
      fieldsetId: "scene",
      name: "Draft",
      values: {
        title: "Draft title"
      }
    });

    yield* session.saveSnapshot({
      fieldsetId: "scene",
      values: {
        title: "Saved title"
      }
    });

    const saved = yield* session.readSnapshot({
      fieldsetId: "scene",
      snapshotId: "snapshot_test-id-1"
    });

    assert.deepStrictEqual(saved.snapshot.values, {
      title: "Saved title"
    });

    const deleted = yield* session.deleteSnapshot({
      fieldsetId: "scene",
      snapshotId: "snapshot_test-id-1"
    });

    assert.deepStrictEqual(deleted, {
      state: {
        activeFieldsetId: "scene",
        activeBaseByFieldset: {
          scene: {
            type: "defaults"
          },
          camera: {
            type: "defaults"
          }
        },
        currentValuesByFieldset: {
          scene: {
            title: "Default"
          },
          camera: {
            zoom: 1
          }
        }
      },
      snapshots: []
    });
  }).pipe(Effect.provide(controlSessionLayer(definition, {
    load: () => Effect.succeed(persisted),
    save: (data) => Effect.sync(() => {
      persisted = data;
    })
  })));
});

function testDefinition() {
  return defineControlPanel({
    fieldsets: {
      scene: {
        fields: {
          title: controlField.text({ default: "Default" })
        }
      },
      camera: {
        fields: {
          zoom: controlField.number({ default: 1 })
        }
      }
    }
  });
}

function controlSessionLayer(
  definition: ReturnType<typeof testDefinition>,
  persistence: {
    readonly load: () => Effect.Effect<unknown>;
    readonly save: (data: ControlSnapshotStoreData) => Effect.Effect<void>;
  }
) {
  return Layer.provide(
    ControlSession.layer(definition),
    testStoreLayer(persistence)
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
        save: (data) => persistence.save(data)
      }),
      Layer.succeed(IdGenerator)({
        next: (prefix) => {
          idIndex += 1;
          return Effect.succeed(prefix ? `${prefix}_test-id-${idIndex}` : `test-id-${idIndex}`);
        }
      })
    )
  );
}

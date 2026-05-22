import { assert, it } from "@effect/vitest";
import { IdGenerator } from "@repo/core";
import { Effect, Layer } from "effect";
import {
  controlField,
  controlPanelRouteDefinitions,
  controlPanelRoutePaths,
  controlPanelTool,
  ControlSnapshotPersistence,
  ControlSnapshotStore,
  type ControlSnapshotStoreData
} from "../src/index.ts";

it("defines schema-backed route metadata for control panel tool routes", () => {
  assert.deepStrictEqual(Object.fromEntries(
    Object.entries(controlPanelRouteDefinitions).map(([key, definition]) => [key, {
      method: definition.method,
      path: definition.path
    }])
  ), {
    index: { method: "GET", path: "index" },
    state: { method: "GET", path: "state" },
    selectFieldset: { method: "POST", path: "state/select-fieldset" },
    selectBase: { method: "POST", path: "state/select-base" },
    snapshots: { method: "GET", path: "snapshots" },
    readSnapshot: { method: "POST", path: "snapshots/read" },
    branchSnapshot: { method: "POST", path: "snapshots/branch" },
    saveSnapshot: { method: "POST", path: "snapshots/save" },
    deleteSnapshot: { method: "POST", path: "snapshots/delete" }
  });
});

it.effect("returns config and persisted active state from the index route", () => {
  let persisted: unknown = {
    version: 1,
    snapshots: []
  };
  const registration = controlPanelTool({
    fieldsets: {
      scene: {
        fields: {
          title: controlField.text({ default: "Hello" })
        }
      },
      camera: {
        fields: {
          zoom: controlField.number({ default: 2 })
        }
      }
    }
  });
  const route = registration.tool.routes?.[controlPanelRoutePaths.index];

  return Effect.gen(function*() {
    const response = route ? yield* route(request("GET")) : undefined;

    assert.deepStrictEqual(response, {
      config: registration.config,
      state: {
        activeFieldsetId: "scene",
        activeBaseByFieldset: {
          scene: { type: "defaults" },
          camera: { type: "defaults" }
        },
        currentValuesByFieldset: {
          scene: { title: "Hello" },
          camera: { zoom: 2 }
        }
      }
    });
    assert.deepStrictEqual(persisted, {
      version: 1,
      snapshots: []
    });
  }).pipe(Effect.provide(testStoreLayer({
    load: () => Effect.succeed(persisted),
    save: (data) => Effect.sync(() => {
      persisted = data;
    })
  })));
});

it.effect("persists active fieldset selection across route reads", () => {
  let persisted: unknown = {
    version: 1,
    snapshots: []
  };
  const registration = controlPanelTool({
    fieldsets: {
      scene: {
        fields: {
          title: controlField.text()
        }
      },
      camera: {
        fields: {
          zoom: controlField.number()
        }
      }
    }
  });
  const selectFieldset = registration.tool.routes?.[controlPanelRoutePaths.selectFieldset];
  const state = registration.tool.routes?.[controlPanelRoutePaths.state];

  return Effect.gen(function*() {
    yield* selectFieldset ? selectFieldset(request("POST", { fieldsetId: "camera" })) : Effect.succeed(undefined);
    const response = state ? yield* state(request("GET")) : undefined;

    assert.deepStrictEqual(response, {
      state: {
        activeFieldsetId: "camera",
        activeBaseByFieldset: {
          scene: { type: "defaults" },
          camera: { type: "defaults" }
        },
        currentValuesByFieldset: {
          scene: { title: "" },
          camera: { zoom: 0 }
        }
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
  }).pipe(Effect.provide(testStoreLayer({
    load: () => Effect.succeed(persisted),
    save: (data) => Effect.sync(() => {
      persisted = data;
    })
  })));
});

it.effect("branches, saves, reads, and deletes snapshots through tool routes", () => {
  let persisted: unknown = {
    version: 1,
    snapshots: []
  };
  const registration = controlPanelTool({
    fieldsets: {
      scene: {
        fields: {
          title: controlField.text({ default: "Default" })
        }
      }
    }
  });
  const branch = registration.tool.routes?.[controlPanelRoutePaths.branchSnapshot];
  const save = registration.tool.routes?.[controlPanelRoutePaths.saveSnapshot];
  const read = registration.tool.routes?.[controlPanelRoutePaths.readSnapshot];
  const remove = registration.tool.routes?.[controlPanelRoutePaths.deleteSnapshot];

  return Effect.gen(function*() {
    const branched = branch ? yield* branch(request("POST", {
      fieldsetId: "scene",
      name: "Draft",
      values: {
        title: "Draft title"
      }
    })) : undefined;

    assert.deepStrictEqual(branched, {
      snapshot: {
        id: "snapshot_test-id-1",
        name: "Draft",
        fieldsetId: "scene",
        values: {
          title: "Draft title"
        }
      },
      state: {
        activeFieldsetId: "scene",
        activeBaseByFieldset: {
          scene: {
            type: "snapshot",
            snapshotId: "snapshot_test-id-1"
          }
        },
        currentValuesByFieldset: {
          scene: {
            title: "Draft title"
          }
        }
      }
    });

    yield* save ? save(request("POST", {
      fieldsetId: "scene",
      values: {
        title: "Saved title"
      }
    })) : Effect.succeed(undefined);

    assert.deepStrictEqual(read ? yield* read(request("POST", {
      fieldsetId: "scene",
      snapshotId: "snapshot_test-id-1"
    })) : undefined, {
      snapshot: {
        id: "snapshot_test-id-1",
        name: "Draft",
        fieldsetId: "scene",
        values: {
          title: "Saved title"
        }
      }
    });

    assert.deepStrictEqual(remove ? yield* remove(request("POST", {
      fieldsetId: "scene",
      snapshotId: "snapshot_test-id-1"
    })) : undefined, {
      state: {
        activeFieldsetId: "scene",
        activeBaseByFieldset: {
          scene: {
            type: "defaults"
          }
        },
        currentValuesByFieldset: {
          scene: {
            title: "Default"
          }
        }
      },
      snapshots: []
    });
  }).pipe(Effect.provide(testStoreLayer({
    load: () => Effect.succeed(persisted),
    save: (data) => Effect.sync(() => {
      persisted = data;
    })
  })));
});

function request(method: string, body?: unknown): Request {
  return new Request("http://belt.local/__toolbar/tools/control-panel", {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: body === undefined ? undefined : {
      "content-type": "application/json"
    }
  });
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

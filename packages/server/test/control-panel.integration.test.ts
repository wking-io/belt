import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { assert, describe, it } from "@effect/vitest";
import {
  IdGenerator,
  defineToolbar,
  toolbarApiRoutes,
  toolbarApiToolPath,
  toolApiRoutePath,
  type ToolDefinition,
} from "@repo/core";
import { Effect, Layer } from "effect";
import { createToolbarRouteHandler } from "../../adapter-remix/src/index.ts";
import {
  ControlSnapshotPersistence,
  ControlSnapshotStore,
  controlField,
  controlPanelTool,
  type ControlSnapshotStoreData,
} from "../../control-panel-core/src/index.ts";
import { createToolbarServer } from "../src/index.ts";

describe("Control Panel backend integration", () => {
  it.effect("serves Control Panel metadata through standard Toolbar envelopes", () =>
    Effect.gen(function* () {
      const { server } = controlPanelHarness();

      try {
        const rootResponse = yield* Effect.promise(() =>
          server.fetch(request(toolbarApiRoutes.root)),
        );
        const root = yield* json(rootResponse);

        assert.strictEqual(rootResponse.status, 200);
        assert.deepStrictEqual(root, {
          ok: true,
          data: {
            apiVersion: 1,
            tools: [controlPanelMetadata],
          },
        });

        const toolResponse = yield* Effect.promise(() =>
          server.fetch(request(toolbarApiToolPath("control-panel"))),
        );
        const tool = yield* json(toolResponse);

        assert.strictEqual(toolResponse.status, 200);
        assert.deepStrictEqual(tool, {
          ok: true,
          data: {
            tool: controlPanelMetadata,
          },
        });

        const methodResponse = yield* Effect.promise(() =>
          server.fetch(
            request(toolbarApiToolPath("control-panel"), {
              method: "POST",
            }),
          ),
        );

        assert.strictEqual(methodResponse.status, 405);
        assert.deepStrictEqual(yield* json(methodResponse), {
          ok: false,
          error: {
            code: "METHOD_NOT_ALLOWED",
            message: "Method not allowed",
          },
        });
      } finally {
        yield* Effect.promise(() => server.dispose());
      }
    }),
  );

  it.effect(
    "persists active state and snapshot changes through server and Remix adapter dispatch",
    () =>
      Effect.gen(function* () {
        const harness = controlPanelHarness();

        try {
          const selected = yield* controlPanelJson(() =>
            harness.server.fetch(
              controlPanelRequest("state/select-fieldset", "POST", {
                fieldsetId: "camera",
              }),
            ),
          );

          assert.deepStrictEqual(selected.state.activeFieldsetId, "camera");
          assert.deepStrictEqual(harness.persisted, {
            version: 1,
            activeFieldsetId: "camera",
            activeBaseByFieldset: {
              camera: { type: "defaults" },
              scene: { type: "defaults" },
            },
            snapshots: [],
          });

          const branched = yield* controlPanelJson(() =>
            harness.remix({
              request: controlPanelRequest("snapshots/branch", "POST", {
                fieldsetId: "scene",
                name: "Draft",
                values: {
                  exposure: 3,
                  title: "Draft title",
                },
              }),
            }),
          );

          assert.deepStrictEqual(branched.snapshot, {
            id: "snapshot_test-id-1",
            fieldsetId: "scene",
            name: "Draft",
            values: {
              exposure: 3,
              title: "Draft title",
            },
          });
          assert.deepStrictEqual(branched.state.activeBaseByFieldset.scene, {
            type: "snapshot",
            snapshotId: "snapshot_test-id-1",
          });

          const saved = yield* controlPanelJson(() =>
            harness.server.fetch(
              controlPanelRequest("snapshots/save", "POST", {
                fieldsetId: "scene",
                values: {
                  exposure: 5,
                  title: "Saved title",
                },
              }),
            ),
          );

          assert.deepStrictEqual(saved.state.currentValuesByFieldset.scene, {
            exposure: 5,
            title: "Saved title",
          });

          const restored = yield* controlPanelJson(() =>
            harness.remix({
              request: controlPanelRequest("snapshots/read", "POST", {
                fieldsetId: "scene",
                snapshotId: "snapshot_test-id-1",
              }),
            }),
          );

          assert.deepStrictEqual(restored.snapshot.values, {
            exposure: 5,
            title: "Saved title",
          });

          const deleted = yield* controlPanelJson(() =>
            harness.server.fetch(
              controlPanelRequest("snapshots/delete", "POST", {
                fieldsetId: "scene",
                snapshotId: "snapshot_test-id-1",
              }),
            ),
          );

          assert.deepStrictEqual(deleted, {
            state: {
              activeFieldsetId: "camera",
              activeBaseByFieldset: {
                camera: { type: "defaults" },
                scene: { type: "defaults" },
              },
              currentValuesByFieldset: {
                camera: { zoom: 1 },
                scene: {
                  exposure: 1,
                  title: "Default",
                },
              },
            },
            snapshots: [],
          });
        } finally {
          yield* Effect.promise(() => harness.server.dispose());
          yield* Effect.promise(() => harness.remix.dispose());
        }
      }),
  );

  it.effect(
    "restores persisted snapshot state tolerantly through mounted Control Panel routes",
    () =>
      Effect.gen(function* () {
        const { server } = controlPanelHarness({
          version: 1,
          activeFieldsetId: "missing",
          activeBaseByFieldset: {
            camera: {
              type: "snapshot",
              snapshotId: "snapshot_camera",
            },
            scene: {
              type: "snapshot",
              snapshotId: "snapshot_scene",
            },
          },
          snapshots: [
            {
              id: "snapshot_scene",
              fieldsetId: "scene",
              name: "Scene",
              values: {
                exposure: 4,
                stale: true,
                title: 123,
              },
            },
            {
              id: "snapshot_camera",
              fieldsetId: "camera",
              name: "Camera",
              values: {
                zoom: "far",
              },
            },
            {
              id: "snapshot_removed",
              fieldsetId: "removed",
              name: "Removed",
              values: {
                value: "kept but inactive",
              },
            },
          ],
        });

        try {
          const index = yield* controlPanelJson(() =>
            server.fetch(controlPanelRequest("index", "GET")),
          );

          assert.deepStrictEqual(index.state, {
            activeFieldsetId: "scene",
            activeBaseByFieldset: {
              camera: {
                type: "snapshot",
                snapshotId: "snapshot_camera",
              },
              scene: {
                type: "snapshot",
                snapshotId: "snapshot_scene",
              },
            },
            currentValuesByFieldset: {
              camera: {
                zoom: 1,
              },
              scene: {
                exposure: 4,
                title: "Default",
              },
            },
          });
        } finally {
          yield* Effect.promise(() => server.dispose());
        }
      }),
  );

  it.effect("returns typed Control Panel route errors instead of defects", () =>
    Effect.gen(function* () {
      const { server } = controlPanelHarness();

      try {
        const missingFieldset = yield* Effect.promise(() =>
          server.fetch(
            controlPanelRequest("state/select-fieldset", "POST", {
              fieldsetId: "missing",
            }),
          ),
        );

        assert.strictEqual(missingFieldset.status, 404);
        assert.deepStrictEqual(yield* json(missingFieldset), {
          _tag: "UnknownControlFieldsetError",
          fieldsetId: "missing",
        });

        const missingSnapshot = yield* Effect.promise(() =>
          server.fetch(
            controlPanelRequest("snapshots/read", "POST", {
              fieldsetId: "scene",
              snapshotId: "missing",
            }),
          ),
        );

        assert.strictEqual(missingSnapshot.status, 404);
        assert.deepStrictEqual(yield* json(missingSnapshot), {
          _tag: "UnknownControlSnapshotError",
          snapshotId: "missing",
        });

        const saveDefaults = yield* Effect.promise(() =>
          server.fetch(
            controlPanelRequest("snapshots/save", "POST", {
              fieldsetId: "scene",
              values: {
                exposure: 2,
              },
            }),
          ),
        );

        assert.strictEqual(saveDefaults.status, 409);
        assert.deepStrictEqual(yield* json(saveDefaults), {
          _tag: "CannotSaveDefaultsBaseError",
          fieldsetId: "scene",
        });
      } finally {
        yield* Effect.promise(() => server.dispose());
      }
    }),
  );

  it("keeps framework adapters free of Control Panel-specific behavior", async () => {
    const adapterSources = await Promise.all([
      readFile(join(process.cwd(), "packages/adapter-remix/src/index.ts"), "utf8"),
      readFile(join(process.cwd(), "packages/adapter-vite/src/index.ts"), "utf8"),
    ]);

    for (const source of adapterSources) {
      assert.strictEqual(source.includes("@repo/control-panel-core"), false);
      assert.strictEqual(source.includes("controlPanel"), false);
    }
  });
});

const controlPanelMetadata = {
  id: "control-panel",
  label: "Control Panel",
  routes: [
    "index",
    "snapshots",
    "snapshots/branch",
    "snapshots/delete",
    "snapshots/read",
    "snapshots/save",
    "state",
    "state/select-base",
    "state/select-fieldset",
  ],
};

function controlPanelHarness(initial: ControlSnapshotStoreData = emptySnapshotStore()) {
  let persisted: unknown = initial;
  const registration = controlPanelTool(controlPanelConfig);
  const snapshotStoreLayer = testStoreLayer({
    load: () => Effect.succeed(persisted),
    save: (data) =>
      Effect.sync(() => {
        persisted = data;
      }),
  });
  const config = defineToolbar({
    tools: [
      {
        config: registration.config,
        tool: {
          ...withoutDefaultRuntime(registration.tool),
          apiLayer: Layer.provide(requiredApiLayer(registration.tool), snapshotStoreLayer),
        },
      },
    ],
  });

  return {
    get persisted() {
      return persisted;
    },
    remix: createToolbarRouteHandler(config),
    server: createToolbarServer(config),
  };
}

const controlPanelConfig = {
  fieldsets: {
    scene: {
      fields: {
        exposure: controlField.number({ default: 1 }),
        title: controlField.text({ default: "Default" }),
      },
    },
    camera: {
      fields: {
        zoom: controlField.number({ default: 1 }),
      },
    },
  },
};

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
      Layer.succeed(IdGenerator)({
        next: (prefix) => {
          idIndex += 1;
          return Effect.succeed(prefix ? `${prefix}_test-id-${idIndex}` : `test-id-${idIndex}`);
        },
      }),
    ),
  );
}

function requiredApiLayer(tool: ToolDefinition) {
  if (!tool.apiLayer) {
    throw new Error("Control Panel tool API layer is missing");
  }

  return tool.apiLayer;
}

function withoutDefaultRuntime<Tool extends ToolDefinition>(
  tool: Tool,
): Omit<Tool, "runtimeLayer"> {
  const { runtimeLayer: _defaultRuntimeLayer, ...toolWithoutDefaultRuntime } = tool;

  return toolWithoutDefaultRuntime;
}

function request(pathname: string, init?: RequestInit): Request {
  return new Request(new URL(pathname, "http://belt.local"), init);
}

function controlPanelRequest(routePath: string, method: string, body?: unknown): Request {
  return request(toolApiRoutePath("control-panel", routePath), {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers:
      body === undefined
        ? undefined
        : {
            "content-type": "application/json",
          },
  });
}

function controlPanelJson(fetchResponse: () => Promise<Response>) {
  return Effect.gen(function* () {
    const response = yield* Effect.promise(fetchResponse);

    assert.strictEqual(response.status, 200);

    return yield* json(response);
  });
}

function json(response: Response) {
  return Effect.promise(async (): Promise<unknown> => response.json());
}

function emptySnapshotStore(): ControlSnapshotStoreData {
  return {
    version: 1,
    snapshots: [],
  };
}

import { assert, it } from "@effect/vitest";
import { IdGenerator, toToolbarToolMetadata } from "@repo/core";
import { Effect, Layer } from "effect";
import {
  controlField,
  controlPanelTool,
  controlPanelToolId,
  controlSnapshotActions,
  CannotSaveDefaultsBaseError,
  branchControlSnapshot,
  createControlPanelState,
  defaultsBase,
  defineControlPanel,
  deleteControlSnapshot,
  discardControlChanges,
  DuplicateControlSelectOptionValueError,
  DuplicateControlSnapshotIdError,
  DuplicateControlSnapshotNameError,
  EmptyControlSelectOptionsError,
  getControlConfigHash,
  getCurrentFieldsetValues,
  getActiveControlBase,
  getControlPanelDefaults,
  InvalidControlFieldIdError,
  InvalidControlRangeError,
  InvalidControlSelectDefaultError,
  restoreControlSnapshot,
  saveControlSnapshot,
  selectActiveFieldset,
  selectControlBase,
  validateControlPanel,
  ControlSnapshotPersistence,
  ControlSnapshotStore,
  type ControlSnapshot,
  type ControlPanelValues,
} from "../src/index.ts";

it("defines a control panel config with v1 field builders", () => {
  const config = defineControlPanel({
    fieldsets: {
      hero: {
        label: "Hero",
        fields: {
          title: controlField.text({ default: "Hello" }),
          enabled: controlField.boolean({ default: true }),
          density: controlField.select({
            default: "comfortable",
            options: [
              { label: "Compact", value: "compact" },
              { label: "Comfortable", value: "comfortable" },
            ],
          }),
          accent: controlField.color({ default: "oklch(62% 0.2 260)" }),
          scale: controlField.range({ min: 0, max: 2, step: 0.1, default: 1 }),
          offset: controlField.vector2({ default: { x: 1, y: 2 } }),
          rotation: controlField.vector3({ default: { x: 0, y: 90, z: 0 } }),
        },
      },
    },
  });

  assert.strictEqual(config.fieldsets.hero.fields.title.type, "text");
  assert.strictEqual(config.fieldsets.hero.fields.scale.min, 0);
});

it("normalizes range constraints without materializing field defaults", () => {
  const config = defineControlPanel({
    fieldsets: {
      scene: {
        fields: {
          opacity: controlField.range(),
        },
      },
    },
  });

  assert.deepStrictEqual(config.fieldsets.scene.fields.opacity, {
    type: "range",
    min: 0,
    max: 1,
    step: 0.01,
  });
});

it("exposes internal defaults separately from normalized config", () => {
  const config = defineControlPanel({
    fieldsets: {
      scene: {
        fields: {
          title: controlField.text(),
          count: controlField.number(),
          visible: controlField.boolean(),
          density: controlField.select({
            options: [
              { label: "Compact", value: "compact" },
              { label: "Comfortable", value: "comfortable" },
            ],
          }),
          accent: controlField.color(),
          scale: controlField.range(),
          offset: controlField.vector2(),
          rotation: controlField.vector3(),
        },
      },
    },
  });

  assert.deepStrictEqual(getControlPanelDefaults(config), {
    scene: {
      title: "",
      count: 0,
      visible: false,
      density: "compact",
      accent: "oklch(0% 0 0)",
      scale: 0,
      offset: { x: 0, y: 0 },
      rotation: { x: 0, y: 0, z: 0 },
    },
  });
});

it("computes a shallow config hash from fieldset ids, field ids, and field types", () => {
  const first = defineControlPanel({
    fieldsets: {
      scene: {
        label: "Scene",
        fields: {
          title: controlField.text({ label: "Title", default: "Hello" }),
          scale: controlField.range({ min: 0, max: 10, step: 1, default: 2 }),
        },
      },
    },
  });
  const copyOnlyChange = defineControlPanel({
    fieldsets: {
      scene: {
        label: "Scene controls",
        fields: {
          title: controlField.text({ label: "Headline", default: "Goodbye" }),
          scale: controlField.range({ min: -10, max: 10, step: 0.5, default: 4 }),
        },
      },
    },
  });
  const shapeChange = defineControlPanel({
    fieldsets: {
      scene: {
        fields: {
          title: controlField.text(),
          enabled: controlField.boolean(),
        },
      },
    },
  });
  const reorderOnlyChange = defineControlPanel({
    fieldsets: {
      scene: {
        fields: {
          scale: controlField.range({ min: 0, max: 10, step: 1, default: 2 }),
          title: controlField.text({ label: "Title", default: "Hello" }),
        },
        label: "Scene",
      },
    },
  });

  assert.strictEqual(first.configHash, getControlConfigHash(first));
  assert.strictEqual(first.configHash, copyOnlyChange.configHash);
  assert.strictEqual(first.configHash, reorderOnlyChange.configHash);
  assert.notStrictEqual(first.configHash, shapeChange.configHash);
});

it("infers control values from a defined control panel config", () => {
  const config = defineControlPanel({
    fieldsets: {
      scene: {
        fields: {
          title: controlField.text({ default: "Hello" }),
          count: controlField.number({ default: 2 }),
          visible: controlField.boolean({ default: true }),
          position: controlField.vector3({ default: { x: 1, y: 2, z: 3 } }),
        },
      },
    },
  });

  const values: ControlPanelValues<typeof config> = {
    scene: {
      title: "Updated",
      count: 3,
      visible: false,
      position: { x: 0, y: 1, z: 2 },
    },
  };

  assert.strictEqual(values.scene.position.z, 2);
});

it.effect("validates control panel config through an Effect API", () =>
  Effect.gen(function* () {
    const config = yield* validateControlPanel({
      fieldsets: {
        empty: {
          fields: {},
        },
      },
    });

    assert.deepStrictEqual(config, {
      configHash: getControlConfigHash(config),
      fieldsets: {
        empty: {
          fields: {},
        },
      },
    });
  }),
);

it("registers the control panel as a toolbar tool", () => {
  const registration = controlPanelTool({
    fieldsets: {
      layout: {
        fields: {
          width: controlField.number({ default: 640 }),
        },
      },
    },
  });

  assert.strictEqual(registration.tool.id, controlPanelToolId);
  assert.ok(registration.tool.api);
  assert.ok(registration.tool.apiLayer);
  assert.deepStrictEqual(toToolbarToolMetadata(registration.tool), {
    id: controlPanelToolId,
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
  });
});

it("throws for invalid field ids", () => {
  assert.throws(
    () =>
      defineControlPanel({
        fieldsets: {
          scene: {
            fields: {
              "bad field": controlField.text(),
            },
          },
        },
      }),
    InvalidControlFieldIdError,
  );
});

it("throws for empty select options", () => {
  assert.throws(
    () =>
      defineControlPanel({
        fieldsets: {
          scene: {
            fields: {
              density: controlField.select({ options: [] }),
            },
          },
        },
      }),
    EmptyControlSelectOptionsError,
  );
});

it("throws for select defaults outside static options", () => {
  assert.throws(
    () =>
      defineControlPanel({
        fieldsets: {
          scene: {
            fields: {
              density: controlField.select({
                default: "loose",
                options: [{ label: "Compact", value: "compact" }],
              }),
            },
          },
        },
      }),
    InvalidControlSelectDefaultError,
  );
});

it("throws for duplicate select option values", () => {
  assert.throws(
    () =>
      defineControlPanel({
        fieldsets: {
          scene: {
            fields: {
              density: controlField.select({
                options: [
                  { label: "Compact", value: "compact" },
                  { label: "Compact again", value: "compact" },
                ],
              }),
            },
          },
        },
      }),
    DuplicateControlSelectOptionValueError,
  );
});

it("throws for color defaults with alpha", () => {
  assert.throws(() =>
    defineControlPanel({
      fieldsets: {
        scene: {
          fields: {
            accent: controlField.color({ default: "oklch(62% 0.2 260 / 0.5)" }),
          },
        },
      },
    }),
  );
});

it("throws for invalid range constraints", () => {
  assert.throws(
    () =>
      defineControlPanel({
        fieldsets: {
          scene: {
            fields: {
              opacity: controlField.range({ min: 1, max: 0 }),
            },
          },
        },
      }),
    InvalidControlRangeError,
  );
});

it("creates active state with defaults base separate from active fieldset", () => {
  const config = defineControlPanel({
    fieldsets: {
      scene: {
        fields: {
          title: controlField.text({ default: "Hello" }),
        },
      },
      camera: {
        fields: {
          zoom: controlField.number({ default: 2 }),
        },
      },
    },
  });
  const state = createControlPanelState(config);
  const next = selectActiveFieldset(state, config, "camera");

  assert.strictEqual(state.activeFieldsetId, "scene");
  assert.deepStrictEqual(getActiveControlBase(state, "scene"), defaultsBase);
  assert.deepStrictEqual(getActiveControlBase(state, "camera"), defaultsBase);
  assert.strictEqual(next.activeFieldsetId, "camera");
  assert.deepStrictEqual(getCurrentFieldsetValues(next, config), { zoom: 2 });
});

it("branches snapshots scoped to one fieldset and tracks active bases per fieldset", () => {
  const config = defineControlPanel({
    fieldsets: {
      scene: {
        fields: {
          title: controlField.text(),
        },
      },
      camera: {
        fields: {
          zoom: controlField.number(),
        },
      },
    },
  });
  const initial = createControlPanelState(config);
  const withSceneSnapshot = branchControlSnapshot(initial, config, "scene", {
    id: "scene-a",
    name: "Scene A",
    values: { title: "Draft" },
  });
  const withCameraSnapshot = branchControlSnapshot(withSceneSnapshot, config, "camera", {
    id: "camera-a",
    name: "Camera A",
    values: { zoom: 4 },
  });

  assert.deepStrictEqual(getActiveControlBase(withCameraSnapshot, "scene"), {
    type: "snapshot",
    snapshotId: "scene-a",
  });
  assert.deepStrictEqual(getActiveControlBase(withCameraSnapshot, "camera"), {
    type: "snapshot",
    snapshotId: "camera-a",
  });
  assert.deepStrictEqual(getCurrentFieldsetValues(withCameraSnapshot, config, "scene"), {
    title: "Draft",
  });
  assert.deepStrictEqual(getCurrentFieldsetValues(withCameraSnapshot, config, "camera"), {
    zoom: 4,
  });
});

it("restores snapshots with missing, unknown, and incompatible values falling back to defaults", () => {
  const config = defineControlPanel({
    fieldsets: {
      scene: {
        fields: {
          title: controlField.text({ default: "Untitled" }),
          enabled: controlField.boolean({ default: true }),
          density: controlField.select({
            default: "comfortable",
            options: [
              { label: "Compact", value: "compact" },
              { label: "Comfortable", value: "comfortable" },
            ],
          }),
          position: controlField.vector2({ default: { x: 1, y: 2 } }),
        },
      },
    },
  });
  const snapshot: ControlSnapshot = {
    id: "snapshot-a",
    name: "Snapshot A",
    fieldsetId: "scene",
    values: {
      enabled: "yes",
      density: "stale",
      position: { x: 9 },
      unknown: "ignored",
    },
  };

  assert.deepStrictEqual(restoreControlSnapshot(config, snapshot), {
    title: "Untitled",
    enabled: true,
    density: "comfortable",
    position: { x: 1, y: 2 },
  });
});

it("saves changes only when a snapshot base is active", () => {
  const config = defineControlPanel({
    fieldsets: {
      scene: {
        fields: {
          title: controlField.text(),
        },
      },
    },
  });
  const state = createControlPanelState(config);

  assert.throws(
    () => saveControlSnapshot(state, config, "scene", { title: "Saved" }),
    CannotSaveDefaultsBaseError,
  );

  const branched = branchControlSnapshot(state, config, "scene", {
    id: "scene-a",
    name: "Scene A",
    values: { title: "Draft" },
  });
  const saved = saveControlSnapshot(branched, config, "scene", {
    title: "Saved",
    unknown: "ignored",
  });

  assert.deepStrictEqual(getCurrentFieldsetValues(saved, config, "scene"), { title: "Saved" });
});

it("deletes active snapshots by returning only that fieldset to defaults", () => {
  const config = defineControlPanel({
    fieldsets: {
      scene: {
        fields: {
          title: controlField.text({ default: "Default scene" }),
        },
      },
      camera: {
        fields: {
          zoom: controlField.number({ default: 1 }),
        },
      },
    },
  });
  const state = branchControlSnapshot(
    branchControlSnapshot(createControlPanelState(config), config, "scene", {
      id: "scene-a",
      name: "Scene A",
      values: { title: "Snapshot scene" },
    }),
    config,
    "camera",
    {
      id: "camera-a",
      name: "Camera A",
      values: { zoom: 5 },
    },
  );
  const next = deleteControlSnapshot(state, "scene-a");

  assert.deepStrictEqual(getActiveControlBase(next, "scene"), defaultsBase);
  assert.deepStrictEqual(getActiveControlBase(next, "camera"), {
    type: "snapshot",
    snapshotId: "camera-a",
  });
  assert.deepStrictEqual(getCurrentFieldsetValues(next, config, "scene"), {
    title: "Default scene",
  });
  assert.deepStrictEqual(getCurrentFieldsetValues(next, config, "camera"), { zoom: 5 });
});

it("discards changes by returning current base values without changing base selection", () => {
  const config = defineControlPanel({
    fieldsets: {
      scene: {
        fields: {
          title: controlField.text({ default: "Default" }),
        },
      },
    },
  });
  const state = branchControlSnapshot(createControlPanelState(config), config, "scene", {
    id: "scene-a",
    name: "Scene A",
    values: { title: "Snapshot" },
  });
  const defaults = selectControlBase(state, config, "scene", defaultsBase);

  assert.deepStrictEqual(discardControlChanges(state, config, "scene"), { title: "Snapshot" });
  assert.deepStrictEqual(discardControlChanges(defaults, config, "scene"), { title: "Default" });
});

it("rejects duplicate snapshot ids and duplicate snapshot names per fieldset", () => {
  const config = defineControlPanel({
    fieldsets: {
      scene: {
        fields: {
          title: controlField.text(),
        },
      },
    },
  });
  const state = branchControlSnapshot(createControlPanelState(config), config, "scene", {
    id: "scene-a",
    name: "Scene A",
    values: { title: "A" },
  });

  assert.throws(
    () =>
      branchControlSnapshot(state, config, "scene", {
        id: "scene-a",
        name: "Scene B",
        values: { title: "B" },
      }),
    DuplicateControlSnapshotIdError,
  );
  assert.throws(
    () =>
      branchControlSnapshot(state, config, "scene", {
        id: "scene-b",
        name: "Scene A",
        values: { title: "B" },
      }),
    DuplicateControlSnapshotNameError,
  );
});

it("models the v1 snapshot actions", () => {
  assert.deepStrictEqual(controlSnapshotActions, [
    "saveChanges",
    "branchSnapshot",
    "discardChanges",
    "deleteSnapshot",
  ]);
});

const emptySnapshotStoreLayer = Layer.provide(
  ControlSnapshotStore.layer,
  Layer.mergeAll(
    Layer.succeed(ControlSnapshotPersistence)({
      load: () =>
        Effect.succeed({
          version: 1,
          snapshots: [],
        }),
      save: () => Effect.void,
    }),
    Layer.succeed(IdGenerator)({
      next: (prefix) => Effect.succeed(prefix ? `${prefix}_test-id` : "test-id"),
    }),
  ),
);

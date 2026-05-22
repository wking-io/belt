import { defineTool, normalizeRoute } from "@repo/core";
import { Effect, Schema } from "effect";
import { HttpApi, HttpApiEndpoint, HttpApiGroup, OpenApi } from "effect/unstable/httpapi";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import {
  controlPanelToolId,
  controlPanelToolLabel,
  defineControlPanel,
  ControlPanelDefinitionSchema,
  type ControlPanelConfig,
  type ControlPanelRegistration
} from "../config/index.js";
import {
  ControlVector2ValueSchema,
  ControlVector3ValueSchema,
  type ControlFieldsetValueMap
} from "../config/fields.js";
import {
  branchControlSnapshot,
  createControlPanelState,
  deleteControlSnapshot,
  defaultsBase,
  getCurrentFieldsetValues,
  saveControlSnapshot,
  selectActiveFieldset,
  selectControlBase,
  type ControlBase,
  type ControlPanelState,
  type ControlSnapshot
} from "../state/index.js";
import {
  ControlBaseSchema,
  ControlSnapshotSchema,
  ControlSnapshotStore,
  type ControlSnapshotStoreData
} from "../snapshot-store/index.js";

export const controlPanelRoutePaths = {
  index: "index",
  state: "state",
  selectFieldset: "state/select-fieldset",
  selectBase: "state/select-base",
  snapshots: "snapshots",
  readSnapshot: "snapshots/read",
  branchSnapshot: "snapshots/branch",
  saveSnapshot: "snapshots/save",
  deleteSnapshot: "snapshots/delete"
};

export type ControlPanelRouteState = {
  readonly activeFieldsetId?: string;
  readonly activeBaseByFieldset: Readonly<Record<string, ControlBase>>;
  readonly currentValuesByFieldset: Readonly<Record<string, ControlFieldsetValueMap>>;
};

export type ControlPanelStateResponse = {
  readonly state: ControlPanelRouteState;
};

export type ControlPanelIndexResponse = ControlPanelStateResponse & {
  readonly config: ReturnType<typeof defineControlPanel>;
};

export type ControlPanelSnapshotsResponse = {
  readonly snapshots: readonly ControlSnapshot[];
};

export const ControlFieldsetValueMapSchema = Schema.Record(
  Schema.String,
  Schema.Union([Schema.String, Schema.Number, Schema.Boolean, ControlVector2ValueSchema, ControlVector3ValueSchema])
);

export const ControlPanelRouteStateSchema = Schema.Struct({
  activeFieldsetId: Schema.optionalKey(Schema.String),
  activeBaseByFieldset: Schema.Record(Schema.String, ControlBaseSchema),
  currentValuesByFieldset: Schema.Record(Schema.String, ControlFieldsetValueMapSchema)
});

export const ControlPanelStateResponseSchema = Schema.Struct({
  state: ControlPanelRouteStateSchema
});

export const ControlPanelIndexResponseSchema = Schema.Struct({
  config: ControlPanelDefinitionSchema,
  state: ControlPanelRouteStateSchema
});

export const ControlPanelSnapshotsResponseSchema = Schema.Struct({
  snapshots: Schema.Array(ControlSnapshotSchema)
});

export const ControlPanelSnapshotResponseSchema = Schema.Struct({
  snapshot: ControlSnapshotSchema
});

export const ControlPanelSnapshotStateResponseSchema = Schema.Struct({
  snapshot: ControlSnapshotSchema,
  state: ControlPanelRouteStateSchema
});

export const ControlPanelDeleteSnapshotResponseSchema = Schema.Struct({
  state: ControlPanelRouteStateSchema,
  snapshots: Schema.Array(ControlSnapshotSchema)
});

export const SelectFieldsetRequestSchema = Schema.Struct({
  fieldsetId: Schema.String
});

export const DefaultsBaseRequestSchema = Schema.Struct({
  type: Schema.Literal("defaults")
});

export const SnapshotBaseRequestSchema = Schema.Struct({
  type: Schema.Literal("snapshot"),
  snapshotId: Schema.String
});

export const ControlBaseRequestSchema = Schema.Union([DefaultsBaseRequestSchema, SnapshotBaseRequestSchema]);

export const SelectBaseRequestSchema = Schema.Struct({
  fieldsetId: Schema.String,
  base: ControlBaseRequestSchema
});

export const SnapshotRequestSchema = Schema.Struct({
  fieldsetId: Schema.String,
  snapshotId: Schema.String
});

export const BranchSnapshotRequestSchema = Schema.Struct({
  fieldsetId: Schema.String,
  name: Schema.String,
  values: ControlFieldsetValueMapSchema
});

export const SaveSnapshotRequestSchema = Schema.Struct({
  fieldsetId: Schema.String,
  values: ControlFieldsetValueMapSchema
});

export class ControlPanelToolApiGroup extends HttpApiGroup.make("control-panel")
  .add(
    HttpApiEndpoint.get("index", normalizeRoute(controlPanelRoutePaths.index), {
      success: ControlPanelIndexResponseSchema
    }),
    HttpApiEndpoint.get("state", normalizeRoute(controlPanelRoutePaths.state), {
      success: ControlPanelStateResponseSchema
    }),
    HttpApiEndpoint.post("selectFieldset", normalizeRoute(controlPanelRoutePaths.selectFieldset), {
      payload: SelectFieldsetRequestSchema,
      success: ControlPanelStateResponseSchema
    }),
    HttpApiEndpoint.post("selectBase", normalizeRoute(controlPanelRoutePaths.selectBase), {
      payload: SelectBaseRequestSchema,
      success: ControlPanelStateResponseSchema
    }),
    HttpApiEndpoint.get("snapshots", normalizeRoute(controlPanelRoutePaths.snapshots), {
      success: ControlPanelSnapshotsResponseSchema
    }),
    HttpApiEndpoint.post("readSnapshot", normalizeRoute(controlPanelRoutePaths.readSnapshot), {
      payload: SnapshotRequestSchema,
      success: ControlPanelSnapshotResponseSchema
    }),
    HttpApiEndpoint.post("branchSnapshot", normalizeRoute(controlPanelRoutePaths.branchSnapshot), {
      payload: BranchSnapshotRequestSchema,
      success: ControlPanelSnapshotStateResponseSchema
    }),
    HttpApiEndpoint.post("saveSnapshot", normalizeRoute(controlPanelRoutePaths.saveSnapshot), {
      payload: SaveSnapshotRequestSchema,
      success: ControlPanelStateResponseSchema
    }),
    HttpApiEndpoint.post("deleteSnapshot", normalizeRoute(controlPanelRoutePaths.deleteSnapshot), {
      payload: SnapshotRequestSchema,
      success: ControlPanelDeleteSnapshotResponseSchema
    })
  )
  .annotateMerge(OpenApi.annotations({
    title: "Control Panel"
  }))
{}

export class ControlPanelToolApi extends HttpApi.make("control-panel-tool-api")
  .add(ControlPanelToolApiGroup)
  .annotateMerge(OpenApi.annotations({
    title: "Belt Control Panel Tool API"
  }))
{}

export function controlPanelTool<const Config extends ControlPanelConfig>(
  config: Config
): ControlPanelRegistration<Config["fieldsets"]> {
  const definition = defineControlPanel(config);

  return {
    config: definition,
    tool: defineTool({
      api: ControlPanelToolApi,
      apiLayer: controlPanelToolApiLayer(definition),
      id: controlPanelToolId,
      label: controlPanelToolLabel
    })
  };
}

export function controlPanelToolApiLayer(definition: ReturnType<typeof defineControlPanel>) {
  return HttpApiBuilder.group(
    ControlPanelToolApi,
    "control-panel",
    Effect.fn("ControlPanelToolApi.handlers")(function*(handlers) {
      return handlers
        .handle("index", () =>
          Effect.gen(function*() {
            const store = yield* ControlSnapshotStore;
            const data = yield* store.read(definition);
            return {
              config: definition,
              state: toControlPanelRouteState(definition, data)
            };
          }).pipe(Effect.orDie))
        .handle("state", () =>
          Effect.gen(function*() {
            const store = yield* ControlSnapshotStore;
            const data = yield* store.read(definition);
            return {
              state: toControlPanelRouteState(definition, data)
            };
          }).pipe(Effect.orDie))
        .handle("selectFieldset", ({ payload }) =>
          Effect.gen(function*() {
            const store = yield* ControlSnapshotStore;
            const data = yield* store.read(definition);
            const state = selectActiveFieldset(toControlPanelState(definition, data), definition, payload.fieldsetId);
            const next = yield* store.write(definition, toSnapshotStoreData(data, state));

            return {
              state: toControlPanelRouteState(definition, next)
            };
          }).pipe(Effect.orDie))
        .handle("selectBase", ({ payload }) =>
          Effect.gen(function*() {
            const store = yield* ControlSnapshotStore;
            const data = yield* store.read(definition);
            const state = selectControlBase(toControlPanelState(definition, data), definition, payload.fieldsetId, payload.base);
            const next = yield* store.write(definition, toSnapshotStoreData(data, state));

            return {
              state: toControlPanelRouteState(definition, next)
            };
          }).pipe(Effect.orDie))
        .handle("snapshots", () =>
          Effect.gen(function*() {
            const store = yield* ControlSnapshotStore;
            const data = yield* store.read(definition);
            return {
              snapshots: data.snapshots
            };
          }).pipe(Effect.orDie))
        .handle("readSnapshot", ({ payload }) =>
          Effect.gen(function*() {
            const store = yield* ControlSnapshotStore;
            const data = yield* store.read(definition);
            const snapshot = getSnapshot(data.snapshots, payload.fieldsetId, payload.snapshotId);

            return {
              snapshot
            };
          }).pipe(Effect.orDie))
        .handle("branchSnapshot", ({ payload }) =>
          Effect.gen(function*() {
            const store = yield* ControlSnapshotStore;
            const snapshot = yield* store.create(definition, payload.fieldsetId, {
              name: payload.name,
              values: payload.values
            });
            const data = yield* store.read(definition);

            return {
              snapshot,
              state: toControlPanelRouteState(definition, data)
            };
          }).pipe(Effect.orDie))
        .handle("saveSnapshot", ({ payload }) =>
          Effect.gen(function*() {
            const store = yield* ControlSnapshotStore;
            const data = yield* store.read(definition);
            const state = saveControlSnapshot(toControlPanelState(definition, data), definition, payload.fieldsetId, payload.values);
            const next = yield* store.write(definition, toSnapshotStoreData(data, state));

            return {
              state: toControlPanelRouteState(definition, next)
            };
          }).pipe(Effect.orDie))
        .handle("deleteSnapshot", ({ payload }) =>
          Effect.gen(function*() {
            const store = yield* ControlSnapshotStore;
            const data = yield* store.read(definition);
            getSnapshot(data.snapshots, payload.fieldsetId, payload.snapshotId);
            const state = deleteControlSnapshot(toControlPanelState(definition, data), payload.snapshotId);
            const next = yield* store.write(definition, toSnapshotStoreData(data, state, payload.snapshotId));

            return {
              state: toControlPanelRouteState(definition, next),
              snapshots: next.snapshots
            };
          }).pipe(Effect.orDie));
    })
  );
}

function toSnapshotStoreData(
  current: ControlSnapshotStoreData,
  state: ControlPanelState,
  deletedSnapshotId?: string
): ControlSnapshotStoreData {
  const next: ControlSnapshotStoreData = {
    version: 1,
    activeBaseByFieldset: state.activeBaseByFieldset,
    snapshots: current.snapshots.filter((snapshot) => snapshot.id !== deletedSnapshotId).map((snapshot) =>
      state.snapshots.find((candidate) => candidate.id === snapshot.id) ?? snapshot
    )
  };

  return state.activeFieldsetId === undefined ? next : {
    ...next,
    activeFieldsetId: state.activeFieldsetId
  };
}

function toControlPanelState(config: ControlPanelConfig, data: ControlSnapshotStoreData): ControlPanelState {
  const snapshots = data.snapshots.filter((snapshot) => config.fieldsets[snapshot.fieldsetId]);

  if (data.activeBaseByFieldset === undefined) {
    return createControlPanelState(config, data.activeFieldsetId === undefined ? { snapshots } : {
      activeFieldsetId: data.activeFieldsetId,
      snapshots
    });
  }

  return createControlPanelState(config, data.activeFieldsetId === undefined
    ? {
      activeBaseByFieldset: data.activeBaseByFieldset,
      snapshots
    }
    : {
      activeFieldsetId: data.activeFieldsetId,
      activeBaseByFieldset: data.activeBaseByFieldset,
      snapshots
    });
}

function toControlPanelRouteState(config: ControlPanelConfig, data: ControlSnapshotStoreData): ControlPanelRouteState {
  const state = toControlPanelState(config, data);
  const currentValuesByFieldset = Object.fromEntries(
    Object.keys(config.fieldsets).map((fieldsetId) => [
      fieldsetId,
      getCurrentFieldsetValues(state, config, fieldsetId)
    ])
  );

  const routeState = {
    activeBaseByFieldset: state.activeBaseByFieldset,
    currentValuesByFieldset
  };

  return state.activeFieldsetId === undefined ? routeState : {
    ...routeState,
    activeFieldsetId: state.activeFieldsetId
  };
}

function getSnapshot(snapshots: readonly ControlSnapshot[], fieldsetId: string, snapshotId: string): ControlSnapshot {
  const snapshot = snapshots.find((candidate) => candidate.id === snapshotId);

  if (!snapshot || snapshot.fieldsetId !== fieldsetId) {
    throw new Error("Unknown control snapshot");
  }

  return snapshot;
}

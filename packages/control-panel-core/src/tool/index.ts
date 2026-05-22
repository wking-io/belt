import { defineTool, type ToolbarToolRoutes, type ToolRouteHandler } from "@repo/core";
import { Effect, Schema } from "effect";
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

export const controlPanelRouteDefinitions = {
  index: {
    method: "GET",
    path: controlPanelRoutePaths.index,
    response: ControlPanelIndexResponseSchema
  },
  state: {
    method: "GET",
    path: controlPanelRoutePaths.state,
    response: ControlPanelStateResponseSchema
  },
  selectFieldset: {
    method: "POST",
    path: controlPanelRoutePaths.selectFieldset,
    request: SelectFieldsetRequestSchema,
    response: ControlPanelStateResponseSchema
  },
  selectBase: {
    method: "POST",
    path: controlPanelRoutePaths.selectBase,
    request: SelectBaseRequestSchema,
    response: ControlPanelStateResponseSchema
  },
  snapshots: {
    method: "GET",
    path: controlPanelRoutePaths.snapshots,
    response: ControlPanelSnapshotsResponseSchema
  },
  readSnapshot: {
    method: "POST",
    path: controlPanelRoutePaths.readSnapshot,
    request: SnapshotRequestSchema,
    response: ControlPanelSnapshotResponseSchema
  },
  branchSnapshot: {
    method: "POST",
    path: controlPanelRoutePaths.branchSnapshot,
    request: BranchSnapshotRequestSchema,
    response: ControlPanelSnapshotStateResponseSchema
  },
  saveSnapshot: {
    method: "POST",
    path: controlPanelRoutePaths.saveSnapshot,
    request: SaveSnapshotRequestSchema,
    response: ControlPanelStateResponseSchema
  },
  deleteSnapshot: {
    method: "POST",
    path: controlPanelRoutePaths.deleteSnapshot,
    request: SnapshotRequestSchema,
    response: ControlPanelDeleteSnapshotResponseSchema
  }
};

export function controlPanelTool<const Config extends ControlPanelConfig>(
  config: Config
): ControlPanelRegistration<Config["fieldsets"], ControlSnapshotStore> {
  const definition = defineControlPanel(config);
  const routes: ToolbarToolRoutes<ControlSnapshotStore> = {
    [controlPanelRoutePaths.index]: method(controlPanelRouteDefinitions.index.method, Effect.fn("ControlPanelRoutes.index")(function*() {
      const store = yield* ControlSnapshotStore;
      const data = yield* store.read(definition);
      return yield* validateRouteResponse({
        config: definition,
        state: toControlPanelRouteState(definition, data)
      }, controlPanelRouteDefinitions.index.response);
    })),
    [controlPanelRoutePaths.state]: method(controlPanelRouteDefinitions.state.method, Effect.fn("ControlPanelRoutes.state")(function*() {
      const store = yield* ControlSnapshotStore;
      const data = yield* store.read(definition);
      return yield* validateRouteResponse({
        state: toControlPanelRouteState(definition, data)
      }, controlPanelRouteDefinitions.state.response);
    })),
    [controlPanelRoutePaths.selectFieldset]: method(controlPanelRouteDefinitions.selectFieldset.method, Effect.fn("ControlPanelRoutes.selectFieldset")(function*(request) {
      const body = yield* decodeJson(request, controlPanelRouteDefinitions.selectFieldset.request);
      const store = yield* ControlSnapshotStore;
      const data = yield* store.read(definition);
      const state = selectActiveFieldset(toControlPanelState(definition, data), definition, body.fieldsetId);
      const next = yield* store.write(definition, toSnapshotStoreData(data, state));

      return yield* validateRouteResponse({
        state: toControlPanelRouteState(definition, next)
      }, controlPanelRouteDefinitions.selectFieldset.response);
    })),
    [controlPanelRoutePaths.selectBase]: method(controlPanelRouteDefinitions.selectBase.method, Effect.fn("ControlPanelRoutes.selectBase")(function*(request) {
      const body = yield* decodeJson(request, controlPanelRouteDefinitions.selectBase.request);
      const store = yield* ControlSnapshotStore;
      const data = yield* store.read(definition);
      const state = selectControlBase(toControlPanelState(definition, data), definition, body.fieldsetId, body.base);
      const next = yield* store.write(definition, toSnapshotStoreData(data, state));

      return yield* validateRouteResponse({
        state: toControlPanelRouteState(definition, next)
      }, controlPanelRouteDefinitions.selectBase.response);
    })),
    [controlPanelRoutePaths.snapshots]: method(controlPanelRouteDefinitions.snapshots.method, Effect.fn("ControlPanelRoutes.snapshots")(function*() {
      const store = yield* ControlSnapshotStore;
      const data = yield* store.read(definition);
      return yield* validateRouteResponse({
        snapshots: data.snapshots
      }, controlPanelRouteDefinitions.snapshots.response);
    })),
    [controlPanelRoutePaths.readSnapshot]: method(controlPanelRouteDefinitions.readSnapshot.method, Effect.fn("ControlPanelRoutes.readSnapshot")(function*(request) {
      const body = yield* decodeJson(request, controlPanelRouteDefinitions.readSnapshot.request);
      const store = yield* ControlSnapshotStore;
      const data = yield* store.read(definition);
      const snapshot = getSnapshot(data.snapshots, body.fieldsetId, body.snapshotId);

      return yield* validateRouteResponse({
        snapshot
      }, controlPanelRouteDefinitions.readSnapshot.response);
    })),
    [controlPanelRoutePaths.branchSnapshot]: method(controlPanelRouteDefinitions.branchSnapshot.method, Effect.fn("ControlPanelRoutes.branchSnapshot")(function*(request) {
      const body = yield* decodeJson(request, controlPanelRouteDefinitions.branchSnapshot.request);
      const store = yield* ControlSnapshotStore;
      const snapshot = yield* store.create(definition, body.fieldsetId, {
          name: body.name,
          values: body.values
        });
      const data = yield* store.read(definition);

      return yield* validateRouteResponse({
        snapshot,
        state: toControlPanelRouteState(definition, data)
      }, controlPanelRouteDefinitions.branchSnapshot.response);
    })),
    [controlPanelRoutePaths.saveSnapshot]: method(controlPanelRouteDefinitions.saveSnapshot.method, Effect.fn("ControlPanelRoutes.saveSnapshot")(function*(request) {
      const body = yield* decodeJson(request, controlPanelRouteDefinitions.saveSnapshot.request);
      const store = yield* ControlSnapshotStore;
      const data = yield* store.read(definition);
      const state = saveControlSnapshot(toControlPanelState(definition, data), definition, body.fieldsetId, body.values);
      const next = yield* store.write(definition, toSnapshotStoreData(data, state));

      return yield* validateRouteResponse({
        state: toControlPanelRouteState(definition, next)
      }, controlPanelRouteDefinitions.saveSnapshot.response);
    })),
    [controlPanelRoutePaths.deleteSnapshot]: method(controlPanelRouteDefinitions.deleteSnapshot.method, Effect.fn("ControlPanelRoutes.deleteSnapshot")(function*(request) {
      const body = yield* decodeJson(request, controlPanelRouteDefinitions.deleteSnapshot.request);
      const store = yield* ControlSnapshotStore;
      const data = yield* store.read(definition);
      getSnapshot(data.snapshots, body.fieldsetId, body.snapshotId);
      const state = deleteControlSnapshot(toControlPanelState(definition, data), body.snapshotId);
      const next = yield* store.write(definition, toSnapshotStoreData(data, state, body.snapshotId));

      return yield* validateRouteResponse({
        state: toControlPanelRouteState(definition, next),
        snapshots: next.snapshots
      }, controlPanelRouteDefinitions.deleteSnapshot.response);
    }))
  };

  return {
    config: definition,
    tool: defineTool<ControlSnapshotStore>({
      id: controlPanelToolId,
      label: controlPanelToolLabel,
      routes
    })
  };
}

function method<Success, Failure, Requirements>(
  expectedMethod: string,
  handler: ToolRouteHandler<Success, Failure, Requirements>
): ToolRouteHandler<Success, Failure | Error, Requirements> {
  return (request) => Effect.gen(function*() {
    if (request.method !== expectedMethod) {
      return yield* Effect.fail(new Error(`Expected ${expectedMethod}`));
    }

    return yield* handler(request);
  });
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

function decodeJson<S extends Schema.Decoder<unknown>>(
  request: Request,
  schema: S
): Effect.Effect<S["Type"], unknown, never> {
  return Effect.gen(function*() {
    const raw = yield* Effect.tryPromise(() => request.json());
    return yield* Effect.try({
      try: () => Schema.decodeUnknownSync(schema)(raw),
      catch: (cause) => cause
    });
  });
}

function validateRouteResponse<S extends Schema.Decoder<unknown>>(
  response: unknown,
  schema: S
): Effect.Effect<S["Type"], unknown, never> {
  return Effect.try({
    try: () => Schema.decodeUnknownSync(schema)(response),
    catch: (cause) => cause
  });
}

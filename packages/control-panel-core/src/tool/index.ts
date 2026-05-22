import { defineTool, normalizeRoute } from "@repo/core";
import { Effect, Schema } from "effect";
import { HttpApi, HttpApiEndpoint, HttpApiGroup, HttpApiError, HttpApiSchema, OpenApi } from "effect/unstable/httpapi";
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
  createControlPanelState,
  deleteControlSnapshot,
  getCurrentFieldsetValues,
  saveControlSnapshot,
  selectActiveFieldset,
  selectControlBase,
  type ControlBase,
  type ControlPanelState,
  type ControlSnapshot
} from "../state/index.js";
import {
  CannotSaveDefaultsBaseError,
  ControlSnapshotFieldsetMismatchError,
  DuplicateControlSnapshotIdError,
  DuplicateControlSnapshotNameError,
  UnknownControlFieldsetError,
  UnknownControlSnapshotError
} from "../errors.js";
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

const ControlPanelToolApiErrorSchemas = [
  UnknownControlFieldsetError.pipe(HttpApiSchema.status(404)),
  UnknownControlSnapshotError.pipe(HttpApiSchema.status(404)),
  ControlSnapshotFieldsetMismatchError.pipe(HttpApiSchema.status(409)),
  DuplicateControlSnapshotIdError.pipe(HttpApiSchema.status(409)),
  DuplicateControlSnapshotNameError.pipe(HttpApiSchema.status(409)),
  CannotSaveDefaultsBaseError.pipe(HttpApiSchema.status(409)),
  HttpApiError.InternalServerError
] as const;

type ControlPanelToolApiError =
  | UnknownControlFieldsetError
  | UnknownControlSnapshotError
  | ControlSnapshotFieldsetMismatchError
  | DuplicateControlSnapshotIdError
  | DuplicateControlSnapshotNameError
  | CannotSaveDefaultsBaseError
  | HttpApiError.InternalServerError;

export class ControlPanelToolApiGroup extends HttpApiGroup.make("control-panel")
  .add(
    HttpApiEndpoint.get("index", normalizeRoute(controlPanelRoutePaths.index), {
      error: ControlPanelToolApiErrorSchemas,
      success: ControlPanelIndexResponseSchema
    }),
    HttpApiEndpoint.get("state", normalizeRoute(controlPanelRoutePaths.state), {
      error: ControlPanelToolApiErrorSchemas,
      success: ControlPanelStateResponseSchema
    }),
    HttpApiEndpoint.post("selectFieldset", normalizeRoute(controlPanelRoutePaths.selectFieldset), {
      error: ControlPanelToolApiErrorSchemas,
      payload: SelectFieldsetRequestSchema,
      success: ControlPanelStateResponseSchema
    }),
    HttpApiEndpoint.post("selectBase", normalizeRoute(controlPanelRoutePaths.selectBase), {
      error: ControlPanelToolApiErrorSchemas,
      payload: SelectBaseRequestSchema,
      success: ControlPanelStateResponseSchema
    }),
    HttpApiEndpoint.get("snapshots", normalizeRoute(controlPanelRoutePaths.snapshots), {
      error: ControlPanelToolApiErrorSchemas,
      success: ControlPanelSnapshotsResponseSchema
    }),
    HttpApiEndpoint.post("readSnapshot", normalizeRoute(controlPanelRoutePaths.readSnapshot), {
      error: ControlPanelToolApiErrorSchemas,
      payload: SnapshotRequestSchema,
      success: ControlPanelSnapshotResponseSchema
    }),
    HttpApiEndpoint.post("branchSnapshot", normalizeRoute(controlPanelRoutePaths.branchSnapshot), {
      error: ControlPanelToolApiErrorSchemas,
      payload: BranchSnapshotRequestSchema,
      success: ControlPanelSnapshotStateResponseSchema
    }),
    HttpApiEndpoint.post("saveSnapshot", normalizeRoute(controlPanelRoutePaths.saveSnapshot), {
      error: ControlPanelToolApiErrorSchemas,
      payload: SaveSnapshotRequestSchema,
      success: ControlPanelStateResponseSchema
    }),
    HttpApiEndpoint.post("deleteSnapshot", normalizeRoute(controlPanelRoutePaths.deleteSnapshot), {
      error: ControlPanelToolApiErrorSchemas,
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
            const data = yield* store.read(definition).pipe(Effect.mapError(toControlPanelToolApiError));
            return {
              config: definition,
              state: toControlPanelRouteState(definition, data)
            };
          }))
        .handle("state", () =>
          Effect.gen(function*() {
            const store = yield* ControlSnapshotStore;
            const data = yield* store.read(definition).pipe(Effect.mapError(toControlPanelToolApiError));
            return {
              state: toControlPanelRouteState(definition, data)
            };
          }))
        .handle("selectFieldset", ({ payload }) =>
          Effect.gen(function*() {
            const store = yield* ControlSnapshotStore;
            const data = yield* store.read(definition).pipe(Effect.mapError(toControlPanelToolApiError));
            const state = yield* syncRoute(() =>
              selectActiveFieldset(toControlPanelState(definition, data), definition, payload.fieldsetId)
            );
            const next = yield* store.write(definition, toSnapshotStoreData(data, state)).pipe(
              Effect.mapError(toControlPanelToolApiError)
            );

            return {
              state: toControlPanelRouteState(definition, next)
            };
          }))
        .handle("selectBase", ({ payload }) =>
          Effect.gen(function*() {
            const store = yield* ControlSnapshotStore;
            const data = yield* store.read(definition).pipe(Effect.mapError(toControlPanelToolApiError));
            const state = yield* syncRoute(() =>
              selectControlBase(toControlPanelState(definition, data), definition, payload.fieldsetId, payload.base)
            );
            const next = yield* store.write(definition, toSnapshotStoreData(data, state)).pipe(
              Effect.mapError(toControlPanelToolApiError)
            );

            return {
              state: toControlPanelRouteState(definition, next)
            };
          }))
        .handle("snapshots", () =>
          Effect.gen(function*() {
            const store = yield* ControlSnapshotStore;
            const data = yield* store.read(definition).pipe(Effect.mapError(toControlPanelToolApiError));
            return {
              snapshots: data.snapshots
            };
          }))
        .handle("readSnapshot", ({ payload }) =>
          Effect.gen(function*() {
            const store = yield* ControlSnapshotStore;
            const data = yield* store.read(definition).pipe(Effect.mapError(toControlPanelToolApiError));
            const snapshot = yield* getSnapshot(data.snapshots, payload.fieldsetId, payload.snapshotId);

            return {
              snapshot
            };
          }))
        .handle("branchSnapshot", ({ payload }) =>
          Effect.gen(function*() {
            const store = yield* ControlSnapshotStore;
            const snapshot = yield* store.create(definition, payload.fieldsetId, {
              name: payload.name,
              values: payload.values
            }).pipe(Effect.mapError(toControlPanelToolApiError));
            const data = yield* store.read(definition).pipe(Effect.mapError(toControlPanelToolApiError));

            return {
              snapshot,
              state: toControlPanelRouteState(definition, data)
            };
          }))
        .handle("saveSnapshot", ({ payload }) =>
          Effect.gen(function*() {
            const store = yield* ControlSnapshotStore;
            const data = yield* store.read(definition).pipe(Effect.mapError(toControlPanelToolApiError));
            const state = yield* syncRoute(() =>
              saveControlSnapshot(toControlPanelState(definition, data), definition, payload.fieldsetId, payload.values)
            );
            const next = yield* store.write(definition, toSnapshotStoreData(data, state)).pipe(
              Effect.mapError(toControlPanelToolApiError)
            );

            return {
              state: toControlPanelRouteState(definition, next)
            };
          }))
        .handle("deleteSnapshot", ({ payload }) =>
          Effect.gen(function*() {
            const store = yield* ControlSnapshotStore;
            const data = yield* store.read(definition).pipe(Effect.mapError(toControlPanelToolApiError));
            yield* getSnapshot(data.snapshots, payload.fieldsetId, payload.snapshotId);
            const state = yield* syncRoute(() =>
              deleteControlSnapshot(toControlPanelState(definition, data), payload.snapshotId)
            );
            const next = yield* store.write(definition, toSnapshotStoreData(data, state, payload.snapshotId)).pipe(
              Effect.mapError(toControlPanelToolApiError)
            );

            return {
              state: toControlPanelRouteState(definition, next),
              snapshots: next.snapshots
            };
          }));
    })
  );
}

function syncRoute<A>(evaluate: () => A): Effect.Effect<A, ControlPanelToolApiError> {
  return Effect.try({
    try: evaluate,
    catch: toControlPanelToolApiError
  });
}

function toControlPanelToolApiError(cause: unknown): ControlPanelToolApiError {
  if (
    cause instanceof UnknownControlFieldsetError ||
    cause instanceof UnknownControlSnapshotError ||
    cause instanceof ControlSnapshotFieldsetMismatchError ||
    cause instanceof DuplicateControlSnapshotIdError ||
    cause instanceof DuplicateControlSnapshotNameError ||
    cause instanceof CannotSaveDefaultsBaseError
  ) {
    return cause;
  }

  return new HttpApiError.InternalServerError({});
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

function getSnapshot(
  snapshots: readonly ControlSnapshot[],
  fieldsetId: string,
  snapshotId: string
): Effect.Effect<ControlSnapshot, ControlPanelToolApiError> {
  const snapshot = snapshots.find((candidate) => candidate.id === snapshotId);

  if (!snapshot) {
    return Effect.fail(new UnknownControlSnapshotError({ snapshotId }));
  }

  if (snapshot.fieldsetId !== fieldsetId) {
    return Effect.fail(new ControlSnapshotFieldsetMismatchError({
      fieldsetId,
      snapshotId,
      snapshotFieldsetId: snapshot.fieldsetId
    }));
  }

  return Effect.succeed(snapshot);
}

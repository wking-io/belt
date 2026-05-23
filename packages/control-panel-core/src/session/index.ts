import { Context, Effect, Layer } from "effect";
import {
  defineControlPanel,
  type ControlPanelConfig
} from "../config/index.js";
import type { ControlFieldsetValueMap } from "../config/fields.js";
import {
  CannotSaveDefaultsBaseError,
  ControlSnapshotFieldsetMismatchError,
  DuplicateControlSnapshotIdError,
  DuplicateControlSnapshotNameError,
  ControlSnapshotStoreParseError,
  ControlSnapshotStoreReadError,
  ControlSnapshotStoreWriteError,
  UnknownControlFieldsetError,
  UnknownControlSnapshotError,
  type ControlSnapshotStoreError
} from "../errors.js";
import {
  ControlSnapshotStore,
  type ControlSnapshotStoreData
} from "../snapshot-store/index.js";
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

export type ControlPanelSnapshotResponse = {
  readonly snapshot: ControlSnapshot;
};

export type ControlPanelSnapshotStateResponse = ControlPanelSnapshotResponse & ControlPanelStateResponse;

export type ControlPanelDeleteSnapshotResponse = ControlPanelStateResponse & ControlPanelSnapshotsResponse;

export type SelectFieldsetRequest = {
  readonly fieldsetId: string;
};

export type SelectBaseRequest = {
  readonly fieldsetId: string;
  readonly base: ControlBase;
};

export type SnapshotRequest = {
  readonly fieldsetId: string;
  readonly snapshotId: string;
};

export type BranchSnapshotRequest = {
  readonly fieldsetId: string;
  readonly name: string;
  readonly values: ControlFieldsetValueMap;
};

export type SaveSnapshotRequest = {
  readonly fieldsetId: string;
  readonly values: ControlFieldsetValueMap;
};

export type ControlSessionError =
  | UnknownControlFieldsetError
  | UnknownControlSnapshotError
  | ControlSnapshotFieldsetMismatchError
  | DuplicateControlSnapshotIdError
  | DuplicateControlSnapshotNameError
  | CannotSaveDefaultsBaseError
  | ControlSnapshotStoreError;

export type ControlSessionShape = {
  readonly index: Effect.Effect<ControlPanelIndexResponse, ControlSessionError>;
  readonly state: Effect.Effect<ControlPanelStateResponse, ControlSessionError>;
  readonly selectFieldset: (
    request: SelectFieldsetRequest
  ) => Effect.Effect<ControlPanelStateResponse, ControlSessionError>;
  readonly selectBase: (
    request: SelectBaseRequest
  ) => Effect.Effect<ControlPanelStateResponse, ControlSessionError>;
  readonly snapshots: Effect.Effect<ControlPanelSnapshotsResponse, ControlSessionError>;
  readonly readSnapshot: (
    request: SnapshotRequest
  ) => Effect.Effect<ControlPanelSnapshotResponse, ControlSessionError>;
  readonly branchSnapshot: (
    request: BranchSnapshotRequest
  ) => Effect.Effect<ControlPanelSnapshotStateResponse, ControlSessionError>;
  readonly saveSnapshot: (
    request: SaveSnapshotRequest
  ) => Effect.Effect<ControlPanelStateResponse, ControlSessionError>;
  readonly deleteSnapshot: (
    request: SnapshotRequest
  ) => Effect.Effect<ControlPanelDeleteSnapshotResponse, ControlSessionError>;
};

export class ControlSession extends Context.Service<ControlSession, ControlSessionShape>()(
  "@repo/control-panel-core/ControlSession"
) {
  static layer(definition: ReturnType<typeof defineControlPanel>) {
    return Layer.effect(
      ControlSession,
      Effect.gen(function*() {
        const store = yield* ControlSnapshotStore;

        return ControlSession.of({
          index: Effect.fn("ControlSession.index")(function*() {
            const data = yield* store.read(definition);

            return {
              config: definition,
              state: toControlPanelRouteState(definition, data)
            };
          })(),
          state: Effect.fn("ControlSession.state")(function*() {
            const data = yield* store.read(definition);

            return {
              state: toControlPanelRouteState(definition, data)
            };
          })(),
          selectFieldset: Effect.fn("ControlSession.selectFieldset")(function*(request) {
            const data = yield* store.read(definition);
            const state = yield* syncSession(() =>
              selectActiveFieldset(toControlPanelState(definition, data), definition, request.fieldsetId)
            );
            const next = yield* store.write(definition, toSnapshotStoreData(data, state));

            return {
              state: toControlPanelRouteState(definition, next)
            };
          }),
          selectBase: Effect.fn("ControlSession.selectBase")(function*(request) {
            const data = yield* store.read(definition);
            const state = yield* syncSession(() =>
              selectControlBase(toControlPanelState(definition, data), definition, request.fieldsetId, request.base)
            );
            const next = yield* store.write(definition, toSnapshotStoreData(data, state));

            return {
              state: toControlPanelRouteState(definition, next)
            };
          }),
          snapshots: Effect.fn("ControlSession.snapshots")(function*() {
            const data = yield* store.read(definition);

            return {
              snapshots: data.snapshots
            };
          })(),
          readSnapshot: Effect.fn("ControlSession.readSnapshot")(function*(request) {
            const data = yield* store.read(definition);
            const snapshot = yield* getSnapshot(data.snapshots, request.fieldsetId, request.snapshotId);

            return {
              snapshot
            };
          }),
          branchSnapshot: Effect.fn("ControlSession.branchSnapshot")(function*(request) {
            const snapshot = yield* store.create(definition, request.fieldsetId, {
              name: request.name,
              values: request.values
            });
            const data = yield* store.read(definition);

            return {
              snapshot,
              state: toControlPanelRouteState(definition, data)
            };
          }),
          saveSnapshot: Effect.fn("ControlSession.saveSnapshot")(function*(request) {
            const data = yield* store.read(definition);
            const state = yield* syncSession(() =>
              saveControlSnapshot(toControlPanelState(definition, data), definition, request.fieldsetId, request.values)
            );
            const next = yield* store.write(definition, toSnapshotStoreData(data, state));

            return {
              state: toControlPanelRouteState(definition, next)
            };
          }),
          deleteSnapshot: Effect.fn("ControlSession.deleteSnapshot")(function*(request) {
            const data = yield* store.read(definition);
            yield* getSnapshot(data.snapshots, request.fieldsetId, request.snapshotId);
            const state = yield* syncSession(() =>
              deleteControlSnapshot(toControlPanelState(definition, data), request.snapshotId)
            );
            const next = yield* store.write(definition, toSnapshotStoreData(data, state, request.snapshotId));

            return {
              state: toControlPanelRouteState(definition, next),
              snapshots: next.snapshots
            };
          })
        });
      })
    );
  }
}

function syncSession<A>(evaluate: () => A): Effect.Effect<A, ControlSessionError> {
  return Effect.try({
    try: evaluate,
    catch: toControlSessionError
  });
}

function toControlSessionError(cause: unknown): ControlSessionError {
  if (
    cause instanceof UnknownControlFieldsetError ||
    cause instanceof UnknownControlSnapshotError ||
    cause instanceof ControlSnapshotFieldsetMismatchError ||
    cause instanceof DuplicateControlSnapshotIdError ||
    cause instanceof DuplicateControlSnapshotNameError ||
    cause instanceof CannotSaveDefaultsBaseError ||
    cause instanceof ControlSnapshotStoreParseError ||
    cause instanceof ControlSnapshotStoreReadError ||
    cause instanceof ControlSnapshotStoreWriteError
  ) {
    return cause;
  }

  return new ControlSnapshotStoreParseError({ path: "ControlSession", cause });
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
): Effect.Effect<ControlSnapshot, ControlSessionError> {
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

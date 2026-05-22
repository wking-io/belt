import { Effect } from "effect";
import { HttpApiError } from "effect/unstable/httpapi";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import {
  CannotSaveDefaultsBaseError,
  ControlSnapshotFieldsetMismatchError,
  DuplicateControlSnapshotIdError,
  DuplicateControlSnapshotNameError,
  UnknownControlFieldsetError,
  UnknownControlSnapshotError
} from "../errors.js";
import type { ControlPanelConfig } from "../config/index.js";
import { defineControlPanel } from "../config/index.js";
import type { ControlFieldsetValueMap } from "../config/fields.js";
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
import { ControlSnapshotStore, type ControlSnapshotStoreData } from "../snapshot-store/index.js";
import { ControlPanelToolApi, type ControlPanelRouteState, type ControlPanelToolApiError } from "./api.js";

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

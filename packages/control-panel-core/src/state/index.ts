import { getControlFieldDefault, type ControlPanelConfig } from "../config/index.js";
import {
  type ControlField,
  type ControlFieldValue,
  type ControlFieldsetValueMap,
  type ControlSnapshotValueMap,
  isOklchColor,
  isVector2Value,
  isVector3Value,
} from "../config/fields.js";
import {
  CannotSaveDefaultsBaseError,
  ControlSnapshotFieldsetMismatchError,
  DuplicateControlSnapshotIdError,
  DuplicateControlSnapshotNameError,
  UnknownControlFieldsetError,
  UnknownControlSnapshotError,
} from "../errors.js";

export type DefaultsBase = {
  readonly type: "defaults";
};

export type SnapshotBase = {
  readonly type: "snapshot";
  readonly snapshotId: string;
};

export type ControlBase = DefaultsBase | SnapshotBase;

export const defaultsBase: DefaultsBase = {
  type: "defaults",
};

export type ControlSnapshot = {
  readonly id: string;
  readonly name: string;
  readonly fieldsetId: string;
  readonly values: ControlSnapshotValueMap;
};

export type ControlPanelState = {
  readonly activeBaseByFieldset: Readonly<Record<string, ControlBase>>;
  readonly activeFieldsetId?: string;
  readonly snapshots: readonly ControlSnapshot[];
};

export type CreateControlPanelStateOptions = {
  readonly activeBaseByFieldset?: Readonly<Record<string, ControlBase>>;
  readonly activeFieldsetId?: string;
  readonly snapshots?: readonly ControlSnapshot[];
};

export type SnapshotWriteOptions = {
  readonly id: string;
  readonly name: string;
  readonly values: ControlFieldsetValueMap;
};

export const controlSnapshotActions = [
  "saveChanges",
  "branchSnapshot",
  "discardChanges",
  "deleteSnapshot",
] as const;

export type ControlSnapshotAction = (typeof controlSnapshotActions)[number];

export function createControlPanelState(
  config: ControlPanelConfig,
  options: CreateControlPanelStateOptions = {},
): ControlPanelState {
  const fieldsetIds = Object.keys(config.fieldsets);
  const activeFieldsetId = options.activeFieldsetId ?? fieldsetIds[0];
  const activeBaseByFieldset: Record<string, ControlBase> = {};

  assertSnapshots(config, options.snapshots ?? []);

  if (activeFieldsetId !== undefined) {
    assertKnownFieldset(config, activeFieldsetId);
  }

  for (const fieldsetId of fieldsetIds) {
    const activeBase = options.activeBaseByFieldset?.[fieldsetId] ?? defaultsBase;
    activeBaseByFieldset[fieldsetId] = sanitizeControlBase(
      config,
      options.snapshots ?? [],
      fieldsetId,
      activeBase,
    );
  }

  const state = {
    activeBaseByFieldset,
    snapshots: options.snapshots ?? [],
  };

  return activeFieldsetId === undefined ? state : { ...state, activeFieldsetId };
}

export function selectActiveFieldset(
  state: ControlPanelState,
  config: ControlPanelConfig,
  fieldsetId: string,
): ControlPanelState {
  assertKnownFieldset(config, fieldsetId);

  return {
    ...state,
    activeFieldsetId: fieldsetId,
  };
}

export function selectControlBase(
  state: ControlPanelState,
  config: ControlPanelConfig,
  fieldsetId: string,
  base: ControlBase,
): ControlPanelState {
  assertKnownFieldset(config, fieldsetId);

  return {
    ...state,
    activeBaseByFieldset: {
      ...state.activeBaseByFieldset,
      [fieldsetId]: sanitizeControlBase(config, state.snapshots, fieldsetId, base),
    },
  };
}

export function getActiveControlBase(state: ControlPanelState, fieldsetId: string): ControlBase {
  return state.activeBaseByFieldset[fieldsetId] ?? defaultsBase;
}

export function getCurrentFieldsetValues(
  state: ControlPanelState,
  config: ControlPanelConfig,
  fieldsetId: string = state.activeFieldsetId ?? "",
): ControlFieldsetValueMap {
  assertKnownFieldset(config, fieldsetId);

  return getFieldsetValuesForBase(
    state,
    config,
    fieldsetId,
    getActiveControlBase(state, fieldsetId),
  );
}

export function getFieldsetValuesForBase(
  state: ControlPanelState,
  config: ControlPanelConfig,
  fieldsetId: string,
  base: ControlBase,
): ControlFieldsetValueMap {
  assertKnownFieldset(config, fieldsetId);

  if (base.type === "defaults") {
    return getFieldsetDefaults(config, fieldsetId);
  }

  const snapshot = findSnapshot(state.snapshots, base.snapshotId);

  if (!snapshot) {
    throw new UnknownControlSnapshotError({ snapshotId: base.snapshotId });
  }

  assertSnapshotFieldset(fieldsetId, snapshot);

  return restoreControlSnapshot(config, snapshot);
}

export function restoreControlSnapshot(
  config: ControlPanelConfig,
  snapshot: ControlSnapshot,
): ControlFieldsetValueMap {
  assertKnownFieldset(config, snapshot.fieldsetId);
  const defaults = getFieldsetDefaults(config, snapshot.fieldsetId);
  const fields = config.fieldsets[snapshot.fieldsetId]?.fields ?? {};
  const values: Record<string, ControlFieldValue<ControlField>> = {};

  for (const [fieldId, field] of Object.entries(fields)) {
    const savedValue = snapshot.values[fieldId];
    const fallback = defaults[fieldId] ?? getControlFieldDefault(field);
    values[fieldId] =
      savedValue === undefined ? fallback : restoreControlFieldValue(field, savedValue, fallback);
  }

  return values;
}

export function saveControlSnapshot(
  state: ControlPanelState,
  config: ControlPanelConfig,
  fieldsetId: string,
  values: ControlFieldsetValueMap,
): ControlPanelState {
  assertKnownFieldset(config, fieldsetId);
  const activeBase = getActiveControlBase(state, fieldsetId);

  if (activeBase.type === "defaults") {
    throw new CannotSaveDefaultsBaseError({ fieldsetId });
  }

  const existingSnapshot = findSnapshot(state.snapshots, activeBase.snapshotId);

  if (!existingSnapshot) {
    throw new UnknownControlSnapshotError({ snapshotId: activeBase.snapshotId });
  }

  assertSnapshotFieldset(fieldsetId, existingSnapshot);

  return {
    ...state,
    snapshots: state.snapshots.map((snapshot) =>
      snapshot.id === existingSnapshot.id
        ? {
            ...snapshot,
            values: pickKnownFieldValues(config, fieldsetId, values),
          }
        : snapshot,
    ),
  };
}

export function branchControlSnapshot(
  state: ControlPanelState,
  config: ControlPanelConfig,
  fieldsetId: string,
  options: SnapshotWriteOptions,
): ControlPanelState {
  assertKnownFieldset(config, fieldsetId);
  assertUniqueSnapshotId(state.snapshots, options.id);
  assertUniqueSnapshotName(state.snapshots, fieldsetId, options.name);

  const snapshot: ControlSnapshot = {
    id: options.id,
    name: options.name,
    fieldsetId,
    values: pickKnownFieldValues(config, fieldsetId, options.values),
  };

  return {
    ...state,
    activeBaseByFieldset: {
      ...state.activeBaseByFieldset,
      [fieldsetId]: {
        type: "snapshot",
        snapshotId: snapshot.id,
      },
    },
    snapshots: [...state.snapshots, snapshot],
  };
}

export function discardControlChanges(
  state: ControlPanelState,
  config: ControlPanelConfig,
  fieldsetId: string,
): ControlFieldsetValueMap {
  return getCurrentFieldsetValues(state, config, fieldsetId);
}

export function deleteControlSnapshot(
  state: ControlPanelState,
  snapshotId: string,
): ControlPanelState {
  const snapshot = findSnapshot(state.snapshots, snapshotId);

  if (!snapshot) {
    throw new UnknownControlSnapshotError({ snapshotId });
  }

  const activeBaseByFieldset: Record<string, ControlBase> = {};

  for (const [fieldsetId, activeBase] of Object.entries(state.activeBaseByFieldset)) {
    activeBaseByFieldset[fieldsetId] =
      activeBase.type === "snapshot" && activeBase.snapshotId === snapshotId
        ? defaultsBase
        : activeBase;
  }

  return {
    ...state,
    activeBaseByFieldset,
    snapshots: state.snapshots.filter((candidate) => candidate.id !== snapshotId),
  };
}

export function getFieldsetDefaults(
  config: ControlPanelConfig,
  fieldsetId: string,
): ControlFieldsetValueMap {
  const fieldset = config.fieldsets[fieldsetId];

  if (!fieldset) {
    throw new UnknownControlFieldsetError({ fieldsetId });
  }

  const values: Record<string, ControlFieldValue<ControlField>> = {};

  for (const [fieldId, field] of Object.entries(fieldset.fields)) {
    values[fieldId] = getControlFieldDefault(field);
  }

  return values;
}

export function pickKnownFieldValues(
  config: ControlPanelConfig,
  fieldsetId: string,
  values: ControlFieldsetValueMap,
): ControlSnapshotValueMap {
  const fieldset = config.fieldsets[fieldsetId];

  if (!fieldset) {
    throw new UnknownControlFieldsetError({ fieldsetId });
  }

  const snapshotValues: Record<string, unknown> = {};

  for (const fieldId of Object.keys(fieldset.fields)) {
    if (fieldId in values) {
      snapshotValues[fieldId] = values[fieldId];
    }
  }

  return snapshotValues;
}

function restoreControlFieldValue(
  field: ControlField,
  value: unknown,
  fallback: ControlFieldValue<ControlField>,
): ControlFieldValue<ControlField> {
  switch (field.type) {
    case "text":
      return typeof value === "string" ? value : fallback;
    case "number":
    case "range":
      return typeof value === "number" && Number.isFinite(value) ? value : fallback;
    case "boolean":
      return typeof value === "boolean" ? value : fallback;
    case "select":
      return typeof value === "string" && field.options.some((option) => option.value === value)
        ? value
        : fallback;
    case "color":
      return typeof value === "string" && isOklchColor(value) ? value : fallback;
    case "vector2":
      return isVector2Value(value) ? value : fallback;
    case "vector3":
      return isVector3Value(value) ? value : fallback;
  }
}

function sanitizeControlBase(
  config: ControlPanelConfig,
  snapshots: readonly ControlSnapshot[],
  fieldsetId: string,
  base: ControlBase,
): ControlBase {
  if (base.type === "defaults") {
    return defaultsBase;
  }

  const snapshot = findSnapshot(snapshots, base.snapshotId);

  if (!snapshot) {
    throw new UnknownControlSnapshotError({ snapshotId: base.snapshotId });
  }

  assertKnownFieldset(config, fieldsetId);
  assertSnapshotFieldset(fieldsetId, snapshot);

  return base;
}

function assertSnapshots(config: ControlPanelConfig, snapshots: readonly ControlSnapshot[]): void {
  const snapshotIds = new Set<string>();
  const snapshotNamesByFieldset = new Map<string, Set<string>>();

  for (const snapshot of snapshots) {
    assertKnownFieldset(config, snapshot.fieldsetId);

    if (snapshotIds.has(snapshot.id)) {
      throw new DuplicateControlSnapshotIdError({ snapshotId: snapshot.id });
    }

    snapshotIds.add(snapshot.id);

    const names = snapshotNamesByFieldset.get(snapshot.fieldsetId) ?? new Set<string>();

    if (names.has(snapshot.name)) {
      throw new DuplicateControlSnapshotNameError({
        fieldsetId: snapshot.fieldsetId,
        name: snapshot.name,
      });
    }

    names.add(snapshot.name);
    snapshotNamesByFieldset.set(snapshot.fieldsetId, names);
  }
}

export function assertKnownFieldset(config: ControlPanelConfig, fieldsetId: string): void {
  if (!config.fieldsets[fieldsetId]) {
    throw new UnknownControlFieldsetError({ fieldsetId });
  }
}

function assertSnapshotFieldset(fieldsetId: string, snapshot: ControlSnapshot): void {
  if (snapshot.fieldsetId !== fieldsetId) {
    throw new ControlSnapshotFieldsetMismatchError({
      fieldsetId,
      snapshotId: snapshot.id,
      snapshotFieldsetId: snapshot.fieldsetId,
    });
  }
}

function assertUniqueSnapshotId(snapshots: readonly ControlSnapshot[], snapshotId: string): void {
  if (snapshots.some((snapshot) => snapshot.id === snapshotId)) {
    throw new DuplicateControlSnapshotIdError({ snapshotId });
  }
}

function assertUniqueSnapshotName(
  snapshots: readonly ControlSnapshot[],
  fieldsetId: string,
  name: string,
): void {
  if (snapshots.some((snapshot) => snapshot.fieldsetId === fieldsetId && snapshot.name === name)) {
    throw new DuplicateControlSnapshotNameError({ fieldsetId, name });
  }
}

function findSnapshot(
  snapshots: readonly ControlSnapshot[],
  snapshotId: string,
): ControlSnapshot | undefined {
  return snapshots.find((snapshot) => snapshot.id === snapshotId);
}
